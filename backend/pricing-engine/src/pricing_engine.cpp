#include "pricing_engine.h"
#include <sstream>

PricingEngine::Result PricingEngine::compute(double basePrice, int32_t quantity,
                                              int32_t stock, double overrideDiscount) {
    double      discount = 0.0;
    double      surge    = 1.0;
    std::ostringstream reason;

    if (overrideDiscount > 0.0) {
        discount = overrideDiscount;
        reason << "admin override " << static_cast<int>(overrideDiscount * 100) << "% discount";
    } else if (quantity >= BULK_TIER2) {
        discount = DISC_TIER2;
        reason << "20% bulk discount (qty >= 50)";
    } else if (quantity >= BULK_TIER1) {
        discount = DISC_TIER1;
        reason << "10% bulk discount (qty >= 10)";
    }

    if (stock < LOW_STOCK) {
        surge = SURGE_MULT;
        if (!reason.str().empty()) reason << " + ";
        reason << "15% scarcity surcharge (stock < 5)";
    }

    if (reason.str().empty()) reason << "standard price";

    return {basePrice * (1.0 - discount) * surge, discount, reason.str()};
}
