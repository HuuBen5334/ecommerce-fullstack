#include <iostream>
#include <memory>
#include <shared_mutex>
#include <unordered_map>

#include <grpcpp/grpcpp.h>
#include "pricing.grpc.pb.h"
#include "pricing_engine.h"

using grpc::Server;
using grpc::ServerBuilder;
using grpc::ServerContext;
using grpc::Status;
using pricing::DiscountAck;
using pricing::DiscountUpdate;
using pricing::PriceRequest;
using pricing::PriceResponse;
using pricing::PricingService;

class PricingServiceImpl final : public PricingService::Service {

    Status GetPrice(ServerContext*, const PriceRequest* req,
                    PriceResponse* resp) override {
        double override = 0.0;
        {
            // shared_lock: multiple GetPrice calls can read concurrently
            std::shared_lock lock(mutex_);
            auto it = discounts_.find(req->product_id());
            if (it != discounts_.end()) override = it->second;
        }

        auto r = PricingEngine::compute(
            req->base_price(), req->quantity(), req->stock_quantity(), override
        );

        resp->set_computed_price(r.computedPrice);
        resp->set_discount_rate(r.discountRate);
        resp->set_reason(r.reason);
        return Status::OK;
    }

    Status UpdateDiscount(ServerContext*, const DiscountUpdate* req,
                          DiscountAck* resp) override {
        // unique_lock: exclusive write — all readers blocked until this returns
        std::unique_lock lock(mutex_);
        discounts_[req->product_id()] = req->discount_rate();
        resp->set_success(true);
        return Status::OK;
    }

    // alignas(64): mutex_ starts at a cache-line boundary, preventing false
    // sharing with unrelated data in adjacent heap objects under contention.
    alignas(64) std::shared_mutex mutex_;
    std::unordered_map<int64_t, double> discounts_;
};

int main() {
    const std::string addr = "0.0.0.0:50051";
    PricingServiceImpl service;

    ServerBuilder builder;
    builder.AddListeningPort(addr, grpc::InsecureServerCredentials());
    builder.RegisterService(&service);

    auto server = builder.BuildAndStart();
    std::cout << "Pricing engine listening on " << addr << std::endl;
    server->Wait();
}
