import { useState } from "react";

export const useNotes = () => {
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState("");

  const handleAddNote = () => {
    const text = noteText.trim();
    if (!text) return;
    setNotes((prev) => [...prev, text]);
    setNoteText("");
  };

  const handleRemoveNote = (idx) => {
    setNotes((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearAllNotes = () => {
    setNotes([]);
    setNoteText("");
  };

  return {
    notes,
    noteText,
    setNoteText,
    handleAddNote,
    handleRemoveNote,
    clearAllNotes,
  };
};
