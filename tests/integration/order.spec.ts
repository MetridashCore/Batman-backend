import razorpay from "../../services/razorpay";

describe("/api/razorpay/order", () => {
  describe("GET /", () => {
    it("should return all orders", async () => {
      const orders = await razorpay.orders.all();
      if (orders.items.length > 0) {
        for (const order of orders.items) {
          expect(order).toHaveProperty("id");
          expect(order).toHaveProperty("entity");
          expect(order).toHaveProperty("amount");
          expect(order).toHaveProperty("currency");
        }
      }
    });
  });
});
