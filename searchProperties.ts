export async function searchProperties(term: string) {
  console.log("Mock search running for:", term);

  // This is mock data for now (just so it works)
  return [
    {
      id: 1,
      address: "123 Main St",
      city: "Yourtown",
      state: "FL",
      zip: "34211"
    },
    {
      id: 2,
      address: "456 Elm Ave",
      city: "Othertown",
      state: "TX",
      zip: "75001"
    }
  ];
}
