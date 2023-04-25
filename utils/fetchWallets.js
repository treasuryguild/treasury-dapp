import axios from "axios";

export async function fetchWallets(wallet) {
  try {
    const response = await axios.get(`/api/supabaseGetWallets?wallet=${wallet}`);
    console.log("fetchWallets",response.data)
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
}