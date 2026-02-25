import { PostcodeLookupResponse } from "./models/postcode-lookup-response";

export interface PostcodeLookupClient {
  lookupPostcode(postcode: string): Promise<PostcodeLookupResponse>;
}
