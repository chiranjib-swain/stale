jest.mock('node-fetch', () => {
  return jest.fn(async () => ({
    json: async () => ({}), // Mocked response
    text: async () => '',
    ok: true,
    status: 200,
    statusText: 'OK'
  }));
});
