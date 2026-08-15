import express from "express";
import { registerOrganization, loginOrganization, getAllOrganizations, updateOrganization, getOrganizationProfile } from "../controllers/organization.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = express.Router();

// Route to register an organization (including S3 image upload for OrgLogo)
router.post("/register", upload.single("OrgLogo"), registerOrganization);

// Route to login an organization
router.post("/login", loginOrganization);

// Route to fetch all organizations
router.get("/all", getAllOrganizations);

// Route to update an organization by ID
router.put("/update/:id", upload.single("OrgLogo"), updateOrganization);

// Route to fetch details of currently logged-in organization
router.get("/profile", authenticate, getOrganizationProfile);

export default router;
