jest.mock("../firebaseConfig", () => ({
  db: {},
  storage: {},
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

describe("fetchEducationModules", () => {
  const { fetchEducationModules } = require("../firestoreService");
  const originalError = console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it("Firestore modullerini map'leyip state gunceller", async () => {
    const mockDocs = [
      {
        id: "doc-1",
        data: () => ({
          module_name: "Test Modul",
          content: "Test icerik",
          banner_link: "http://image.test/banner.png",
        }),
      },
    ];

    getDocs.mockResolvedValueOnce({ docs: mockDocs });

    const setModules = jest.fn();
    const setLoading = jest.fn();

    const result = await fetchEducationModules(setModules, setLoading);

    expect(getDocs).toHaveBeenCalled();
    expect(setLoading).toHaveBeenCalledWith(true);
    expect(setModules).toHaveBeenCalledWith([
      {
        id: "doc-1",
        moduleName: "Test Modul",
        content: "Test icerik",
        bannerLink: "http://image.test/banner.png",
      },
    ]);
    expect(result[0].moduleName).toBe("Test Modul");
    expect(setLoading).toHaveBeenCalledWith(false);
  });

  it("Hata durumunda setModules'i bos array ile cagirir", async () => {
    getDocs.mockRejectedValueOnce(new Error("firestore failure"));

    const setModules = jest.fn();
    await expect(fetchEducationModules(setModules)).rejects.toThrow();

    expect(setModules).toHaveBeenCalledWith([]);
  });
});
