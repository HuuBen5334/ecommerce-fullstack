#pragma once
#include <cstdint>
#include <string>

class PricingEngine {
public:
    struct Result {
        double      computedPrice;
        double      discountRate;
        std::string reason;
    };

    // Pure function — no shared state, inherently thread-safe.
    // overrideDiscount: admin-set rate that takes priority over bulk tiers.
    static Result compute(double basePrice, int32_t quantity,
                          int32_t stock, double overrideDiscount = 0.0);

private:
    static constexpr int32_t BULK_TIER1 = 10;
    static constexpr int32_t BULK_TIER2 = 50;
    static constexpr double  DISC_TIER1 = 0.10;
    static constexpr double  DISC_TIER2 = 0.20;
    static constexpr int32_t LOW_STOCK  = 5;
    static constexpr double  SURGE_MULT = 1.15;
};
