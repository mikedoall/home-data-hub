import { NextApiRequest, NextApiResponse } from "next";

const FCC_API_BASE = "https://broadbandmap.fcc.gov/arcgis/rest/services";
const FCC_API_PATH = "/BroadbandData/MapServer/2/query";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: "Latitude and longitude are required" });
  }

  const url = `${FCC_API_BASE}${FCC_API_PATH}?f=json&geometry=${lng},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*`;

  try {
    const fccRes = await fetch(url);
    const data = await fccRes.json();

    const providers = data?.features?.map((feature: any) => ({
      name: feature.attributes.ProviderName,
      technologies: [feature.attributes.TechCode],
      maxDownload: feature.attributes.MaxAdDown,
      maxUpload: feature.attributes.MaxAdUp,
      source: "FCC",
    }));

    res.status(200).json({ providers });
  } catch (error) {
    console.error("FCC API error:", error);
    res.status(500).json({ error: "Failed to fetch broadband data" });
  }
}
