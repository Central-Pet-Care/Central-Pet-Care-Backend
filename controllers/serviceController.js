import Service from "../models/service.js";
import { isAdmin } from "./userController.js";

// Create a new service
export function createService(req, res) {
  if (!isAdmin(req)) {
    res.status(403).json({
      message: "Please login as an administrator to add services"
    });
    return;
  }

  const newServiceData = req.body;
  const service = new Service(newServiceData);

  service.save()
    .then(() => {
      res.json({
        message: "Service is created"
      });
    })
    .catch((error) => {
      res.status(400).json({
        message: error.message
      });
    });
}

// Get all services
export function getServices(req, res) {
  Service.find({})
    .then((services) => {
      res.json(services);
    })
    .catch((error) => {
      res.status(500).json({
        message: error.message
      });
    });
}

// Get a single service by ID
export function getServiceById(req, res) {
  const serviceId = req.params.id;

  Service.findById(serviceId)
    .then((service) => {
      if (!service) {
        res.status(404).json({ message: "Service not found" });
        return;
      }
      res.json(service);
    })
    .catch((error) => {
      res.status(500).json({
        message: error.message
      });
    });
}

// Update a service
export function updateService(req, res) {
  if (!isAdmin(req)) {
    res.status(403).json({
      message: "Please login as an administrator to update services"
    });
    return;
  }

  const serviceId = req.params.id;
  const updatedData = req.body;

  Service.findByIdAndUpdate(serviceId, updatedData, { new: true })
    .then((service) => {
      if (!service) {
        res.status(404).json({ message: "Service not found" });
        return;
      }
      res.json({
        message: "Service updated",
        service
      });
    })
    .catch((error) => {
      res.status(400).json({
        message: error.message
      });
    });
}

// Delete a service
export function deleteService(req, res) {
  if (!isAdmin(req)) {
    res.status(403).json({
      message: "Please login as administrator to delete a service"
    });
    return;
  }

  const serviceId = req.params.id;

  Service.findByIdAndDelete(serviceId)
    .then((service) => {
      if (!service) {
        res.status(404).json({ message: "Service not found" });
        return;
      }
      res.json({
        message: "Service deleted"
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: error.message
      });
    });
}
