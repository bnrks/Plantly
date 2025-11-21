jest.mock("../firebaseConfig", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock("firebase/storage", () => ({
  ref: jest.fn(),
  getDownloadURL: jest.fn(),
}));

import { getDocs } from "firebase/firestore";
import { fetchPlantsForWatering } from "../firestoreService";

describe("fetchPlantsForWatering", () => {
  const originalWarn = console.warn;

  beforeEach(() => {
    jest.clearAllMocks();
    console.warn = jest.fn();
  });

  afterAll(() => {
    console.warn = originalWarn;
  });

  it("lastWatered 20 saatten eski olanlari ve hic sulanmayanlari dondurur", async () => {
    const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 saat once
    const recentDate = new Date(Date.now() - 5 * 60 * 60 * 1000); // 5 saat once

    getDocs.mockResolvedValueOnce({
      docs: [
        { id: "1", data: () => ({ name: "A", lastWatered: oldDate }) },
        { id: "2", data: () => ({ name: "B", lastWatered: recentDate }) },
        { id: "3", data: () => ({ name: "C" }) }, // hic sulanmamis
      ],
    });

    const setPlants = jest.fn();
    const setLoading = jest.fn();

    await fetchPlantsForWatering("user-1", setPlants, setLoading);

    expect(setLoading).toHaveBeenCalledWith(true);
    expect(setPlants).toHaveBeenCalledWith([
      { id: "1", name: "A", lastWatered: oldDate },
      { id: "3", name: "C" },
    ]);
    expect(setLoading).toHaveBeenCalledWith(false);
  });

  it("kullanici yoksa uyarir ve loading'i kapatir", async () => {
    const setPlants = jest.fn();
    const setLoading = jest.fn();

    await fetchPlantsForWatering(null, setPlants, setLoading);

    expect(console.warn).toHaveBeenCalled();
    expect(setPlants).not.toHaveBeenCalled();
    expect(setLoading).toHaveBeenCalledWith(false);
  });
});
