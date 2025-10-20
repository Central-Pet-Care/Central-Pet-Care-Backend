import Adoption from "../models/adoption.js";
import { isAdmin } from "./userController.js";
import User from "../models/user.js"; 
import Pet from "../models/pet.js"; 
import { sendEmail } from "./utils/sendEmail.js";





// Apply for adoption
export async function applyForAdoption(req, res) {
  try {
    if (req.user.type === "admin") {
      return res.status(403).json({ message: "Admins cannot apply for adoption" });
    }

    if (
      !req.body.petId ||
      !req.body.homeEnvironment ||
      !req.body.experience ||
      !req.body.personalInfo?.fullName ||
      !req.body.personalInfo?.phone ||
      !req.body.personalInfo?.address ||
      !req.body.personalInfo?.age
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const pet = await Pet.findOne({ petId: req.body.petId });
    if (!pet) {
      return res.status(404).json({ message: "Pet not found" });
    }

    if (pet.adoptionStatus !== "AVAILABLE") {
      return res.status(400).json({ message: "This pet is not available for adoption." });
    }

    const existingRequest = await Adoption.findOne({
      petId: req.body.petId,
      userEmail: req.user.email,
      adoptionStatus: { $in: ["Pending", "Approved"] },
    });
    if (existingRequest) {
      return res.status(400).json({ message: "You already applied for this pet." });
    }

    const newAdoptionData = {
      userEmail: req.user.email,
      alternateEmail: req.body.alternateEmail || null,
      petId: req.body.petId,
      homeEnvironment: req.body.homeEnvironment,
      experience: req.body.experience,
      personalInfo: {
        fullName: req.body.personalInfo?.fullName,
        phone: req.body.personalInfo?.phone,
        address: req.body.personalInfo?.address,
        age: req.body.personalInfo?.age,
      },
      applyDate: new Date(),
      adoptionStatus: "Pending",
    };

    const adoption = new Adoption(newAdoptionData);
    await adoption.save();

    res.json({
      message: "Adoption request submitted successfully",
      adoption: adoption.toObject(),
      petDetails: pet.toObject(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Something went wrong" });
  }
}

// Update an adoption request by petId(user)
export async function updateAdoption(req, res) {
  try {
    const { petId } = req.params;

    const adoption = await Adoption.findOne({ petId, userEmail: req.user.email });
    if (!adoption) {
      return res.status(404).json({ message: "Adoption request not found" });
    }

    if (["COMPLETED", "REJECTED"].includes(adoption.adoptionStatus?.toUpperCase())) {
      return res.status(400).json({ message: "Cannot update after adoption is finalized" });
    }

    if (req.body.alternateEmail !== undefined) {
      adoption.alternateEmail = req.body.alternateEmail || adoption.alternateEmail;
    }

    adoption.personalInfo = {
      ...adoption.personalInfo,
      ...req.body.personalInfo,
    };

    adoption.homeEnvironment = req.body.homeEnvironment || adoption.homeEnvironment;
    adoption.experience = req.body.experience || adoption.experience;

    await adoption.save();
    res.json({ message: "Adoption request updated successfully", adoption });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: error.message });
  }
}


// Delete adoption request (User)
export function deleteAdoptionRequest(req, res) {
  console.log("Deleting request for petId:", req.params.petId);

  Adoption.findOne({ petId: req.params.petId })
    .then((adoption) => {
      if (!adoption) {
        return res.status(404).json({ message: "Request not found" });
      }

     
      if (!req.user || adoption.userEmail !== req.user.email) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this request" });
      }

      if (adoption.adoptionStatus !== "Pending") {
        return res
          .status(400)
          .json({ message: "Cannot delete after review" });
      }

      return adoption.deleteOne().then(() => {
        res.json({ message: "Adoption request deleted" });
      });
    })
    .catch((error) => {
      console.error("Delete error:", error);
      res.status(500).json({ message: error.message });
    });
}



// Fetch all adoption requests (Admin)
export async function getAllAdoptionRequests(req, res) {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Admin only" });
  }

  try {
    const adoptions = await Adoption.find({});

    const adoptionsWithDetails = await Promise.all(
      adoptions.map(async (adoption) => {
        // Fetch pet and user
        const pet = await Pet.findOne({ petId: adoption.petId });
        const user = await User.findOne({ email: adoption.userEmail });

        // Build full adoption object
        const fullAdoption = {
          ...adoption.toObject(),
          petDetails: pet ? pet.toObject() : {},
          userDetails: user ? user.toObject() : {},
        };

        // Remove AI match score completely
        return fullAdoption;
      })
    );

    res.json(adoptionsWithDetails);
  } catch (error) {
    console.error("Error fetching adoptions:", error);
    res.status(500).json({ message: error.message });
  }
}


// Update adoption status (Admin only)
export async function updateAdoptionStatus(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Admin only" });
    }

    const validStatuses = ["Pending", "Approved", "Rejected", "Completed"];
    if (!validStatuses.includes(req.body.adoptionStatus)) {
      return res.status(400).json({ message: "Invalid adoption status" });
    }

    const adoption = await Adoption.findById(req.params.id);
    if (!adoption) {
      return res.status(404).json({ message: "Adoption request not found" });
    }

    adoption.adoptionStatus = req.body.adoptionStatus;

    if (req.body.adoptionStatus === "Rejected") {
      adoption.rejectionReason = req.body.rejectionReason || "Rejected by admin";
      adoption.adoptionDate = null; 
    }

    if (req.body.adoptionStatus === "Completed") {
      adoption.adoptionDate = new Date(); 
    }

    const saved = await adoption.save();

    const pet = await Pet.findOne({ petId: saved.petId });

    if (pet) {
      if (saved.adoptionStatus === "Approved" || saved.adoptionStatus === "Completed") {
        pet.adoptionStatus = "ADOPTED";
        await pet.save();

        // Auto-reject other adoption requests for this pet
        const otherRequests = await Adoption.find({
          petId: saved.petId,
          _id: { $ne: saved._id },
        });

        for (const other of otherRequests) {
          other.adoptionStatus = "Rejected";
          other.rejectionReason = "Another applicant was approved";
          await other.save();

          // Send email to each auto-rejected user
          await sendEmail(
            other.alternateEmail || other.userEmail,
            "🐾 Adoption Request Update",
            `
            Hello ${other.personalInfo?.fullName || "Adopter"},
            We regret to inform you that your adoption request for ${pet.name} was not approved.
            Another applicant has been selected. We truly appreciate your compassion and encourage you to adopt again!
            `
          );
        }
      } else if (saved.adoptionStatus === "Rejected") {
        const hasApprovedOrCompleted = await Adoption.findOne({
          petId: saved.petId,
          adoptionStatus: { $in: ["Approved", "Completed"] },
        });

        if (!hasApprovedOrCompleted) {
          pet.adoptionStatus = "AVAILABLE";
          await pet.save();
        }
      }
    }

    // Send email to user based on their status
    if (saved.adoptionStatus === "Approved") {
      await sendEmail(
        saved.alternateEmail || saved.userEmail,
        "🎉 Your Pet Adoption Request Has Been Approved!",
        `
        Dear ${saved.personalInfo?.fullName || "Adopter"},
        Congratulations! Your adoption request for ${pet?.name} has been approved.

        Our team will contact you soon to finalize the adoption process. 🐶🐱
        `
      );
    } else if (saved.adoptionStatus === "Rejected") {
      await sendEmail(
        saved.alternateEmail || saved.userEmail,
        "🐾 Adoption Request Update",
        `
        Hello ${saved.personalInfo?.fullName || "Adopter"},
        We’re sorry to inform you that your adoption request for ${pet?.name} has been rejected.

        Thank you for your kindness — we hope you’ll consider adopting again!
        `
      );
    }

    res.json({
      message: `Status updated to ${saved.adoptionStatus}`,
      adoption: saved,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update adoption status" });
  }
}



// User track their own adoption requests
export async function trackAdoptionStatus(req, res) {
  try {
    const adoptions = await Adoption.find({ userEmail: req.user.email });

    const adoptionsWithPets = await Promise.all(
      adoptions.map(async (adoption) => {
        const pet = await Pet.findOne({ petId: adoption.petId });
        return {
          ...adoption.toObject(),
          petDetails: pet ? pet.toObject() : null,
        };
      })
    );

    res.json(adoptionsWithPets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


// Get a single adoption request by ID
export async function getAdoptionById(req, res) {
  try {
    const adoption = await Adoption.findById(req.params.id);
    if (!adoption) {
      return res.status(404).json({ message: "Adoption request not found" });
    }

    const pet = await Pet.findOne({ petId: adoption.petId });

    const user = await User.findOne({ email: adoption.userEmail });

    res.json({
      ...adoption.toObject(),
      petDetails: pet ? pet.toObject() : null,
      userDetails: user ? user.toObject() : null, 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


//Fetch single adoption request by Pet ID (Admin)
export async function getAdoptionRequestByPetId(req, res) {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Admin only" });
  }

  try {
    const adoption = await Adoption.findOne({ petId: req.params.petId });
    if (!adoption) {
      return res.status(404).json({ message: "Adoption request not found" });
    }

    const pet = await Pet.findOne({ petId: adoption.petId });
    const user = await User.findOne({ email: adoption.userEmail });

    res.json({
      ...adoption.toObject(),
      petDetails: pet ? pet.toObject() : {},
      userDetails: user ? user.toObject() : {},
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Get adoption request by petId for logged-in user
export async function getMyAdoptionByPetId(req, res) {
  try {
    const adoption = await Adoption.findOne({
      petId: req.params.petId,
      userEmail: req.user.email, 
    });

    if (!adoption) {
      return res.status(404).json({ message: "Adoption request not found" });
    }

    res.json(adoption.toObject());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

