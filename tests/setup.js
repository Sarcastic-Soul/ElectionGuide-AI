jest.mock('@google-cloud/logging', () => {
  return {
    Logging: class {
      log() {
        return {
          write: jest.fn().mockResolvedValue([]),
        };
      }
    }
  };
});
