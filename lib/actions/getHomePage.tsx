// Thin re-export so existing imports stay valid. The actual server
// action lives in ./getPage to keep the "use server" file rules happy.
export { getHomePage } from "./getPage";
