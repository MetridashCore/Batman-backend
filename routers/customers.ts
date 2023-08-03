import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.send("list of customers");
});

export default router;
