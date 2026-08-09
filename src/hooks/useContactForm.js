import { useState } from "react";

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  notes: "",
  quantity: "1",
  artworkColorMode: "",
  artworkWidth: "",
  artworkHeight: "",
  artworkFrame: "",
  artworkFrameColor: "",
  artworkQuantity: "1",
  serviceMaterial: "Nach Empfehlung",
  serviceApplication: "",
  serviceQuantity: "1",
};

export default function useContactForm() {
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [requestSubject, setRequestSubject] = useState("");
  const [requestType, setRequestType] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const openContactModal = (subject, type) => {
    setRequestSubject(subject);
    setRequestType(type);
    setFormData(initialFormData);
    setAttachment(null);
    setContactModalOpen(true);
  };

  const closeContactModal = () => {
    if (isSending) return;
    setContactModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      if (name === "artworkFrame") {
        return {
          ...prev,
          artworkFrame: value,
          artworkFrameColor: value === "Ja" ? prev.artworkFrameColor : "",
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setAttachment(file);
  };

  const validateForm = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      return "Bitte Name und E-Mail ausfüllen.";
    }

    if (requestType === "general" && !formData.notes.trim()) {
      return "Bitte eine Nachricht eingeben.";
    }

    if (requestType === "product" && !formData.quantity.trim()) {
      return "Bitte die Anzahl der benötigten Teile angeben.";
    }

    if (requestType === "custom") {
      if (
        !formData.artworkColorMode.trim() ||
        !String(formData.artworkWidth).trim() ||
        !String(formData.artworkHeight).trim() ||
        !formData.artworkFrame.trim() ||
        !formData.artworkQuantity.trim()
      ) {
        return "Bitte alle Pflichtfelder für das individuelle 3D-Artwork ausfüllen.";
      }

      if (formData.artworkFrame === "Ja" && !formData.artworkFrameColor.trim()) {
        return "Bitte eine Rahmenfarbe auswählen.";
      }
    }

    if (requestType === "service") {
      if (
        !formData.serviceMaterial.trim() ||
        !formData.serviceApplication.trim() ||
        !formData.serviceQuantity.trim()
      ) {
        return "Bitte alle Pflichtfelder für die 3D-Druck Dienstleistung ausfüllen.";
      }
    }

    return null;
  };

  const submitContactForm = async () => {
    const validationError = validateForm();

    if (validationError) {
      alert(validationError);
      return;
    }

    try {
      setIsSending(true);

      const body = new FormData();
      body.append("subject", requestSubject);
      body.append("type", requestType);
      body.append("name", formData.name);
      body.append("email", formData.email);
      body.append("phone", formData.phone);
      body.append("notes", formData.notes);
      body.append("quantity", formData.quantity);
      body.append("artworkColorMode", formData.artworkColorMode);
      body.append("artworkWidth", formData.artworkWidth);
      body.append("artworkHeight", formData.artworkHeight);
      body.append("artworkFrame", formData.artworkFrame);
      body.append("artworkFrameColor", formData.artworkFrameColor);
      body.append("artworkQuantity", formData.artworkQuantity);
      body.append("serviceMaterial", formData.serviceMaterial);
      body.append("serviceApplication", formData.serviceApplication);
      body.append("serviceQuantity", formData.serviceQuantity);

      if (attachment && requestType !== "product" && requestType !== "general") {
        body.append("attachment", attachment);
      }

      const response = await fetch("/api/contact", {
        method: "POST",
        body,
      });

      let result = {};
      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok) {
        throw new Error(result?.error || "Versand fehlgeschlagen.");
      }

      alert("Deine Anfrage wurde erfolgreich gesendet.");
      setContactModalOpen(false);
      setFormData(initialFormData);
      setAttachment(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Beim Versand ist ein Fehler aufgetreten.";
      alert(message);
    } finally {
      setIsSending(false);
    }
  };

  return {
    contactModalOpen,
    requestSubject,
    requestType,
    formData,
    attachment,
    isSending,
    openContactModal,
    closeContactModal,
    handleInputChange,
    handleFileChange,
    submitContactForm,
  };
}
