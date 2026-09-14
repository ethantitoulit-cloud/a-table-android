import { ownerCanWrite } from "../owner";

export async function GET(request: Request) {
  return Response.json({ canEdit: ownerCanWrite(request) });
}
