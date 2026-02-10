import express from "express";
import authRoutes from "./auth.routes.js";
import bookRoutes from "./book.routes.js";
import loanRoutes from "./loan.routes.js";
import reviewRoutes from "./review.routes.js";
import userRoutes from "./user.routes.js";
import dashboardRoutes from "./dashboard.routes.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

router.use("/auth", authRoutes);
router.use("/books", bookRoutes);
router.use("/loans", loanRoutes);
router.use("/reviews", reviewRoutes);
router.use("/users", userRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
