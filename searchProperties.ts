// searchProperties.ts

export async function searchProperties(term: string) {
  console.log("Mock search running for:", term);

  const mockData = [
    {
      id: 1,
      address: "123 Main St",
      city: "Yourtown",
      state: "FL",
      zip: "34211",
    },
    {
      id: 2,
      address: "456 Elm Ave",
      city: "Othertown",
      state: "TX",
      zip: "75001",
    },
  ];

  // Filter based on the search term
  const filtered = mockData.filter((property) => {
    const fullText = `${property.address} ${property.city} ${property.state} ${property.zip}`.toLowerCase();
    return fullText.includes(term.toLowerCase());
  });

  return filtered; // 👈 Return the filtered results directly (no fetch, no API)
}
