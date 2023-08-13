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
    it("should return single order", async () => {
      const order = await razorpay.orders.fetch("order_MO02vp2aJAnNKe");
      expect(order).toBeTruthy();
      expect(order).toHaveProperty("id");
      expect(order).toHaveProperty("amount");
      expect(order).toHaveProperty("currency");
      expect(order).toHaveProperty("entity");
    });
  });
});
