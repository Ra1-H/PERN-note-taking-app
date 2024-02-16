import jwt from "jsonwebtoken";
const SECRET_KEY=process.env.SECRET_KEY;

export const auth = (req: any, res: any, next: any) => {
  try {
    //get req header named Authorizzation where it figures out as [Bearer "token"]
    const authHeader = req.get("Authorization");

    //extract token from Auth.header (aka remove "Bearer")
    const token = authHeader?.split(" ")[1]; //splits the header to  "bearer" "token" and takes the token alone.where token has index 1

    if (!token) {
      return res.status(400).json({ error: "no valid token" });
    }
    //decode token
    const decoded = jwt.verify(
      token,
      //@ts-ignore
      SECRET_KEY
    );
    console.log(decoded);
    //verify token

    req.decoded = decoded;
    next();
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: "something happened" });
  }
};
