
let JWKS;

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Unauthorized access",
      });
    }

    const token = authHeader.split(" ")[1];

    const authURL = process.env.BETTER_AUTH_URL;

    if (!authURL) {
      throw new Error("BETTER_AUTH_URL is missing.");
    }

    const { createRemoteJWKSet, jwtVerify } = await import("jose");

    if (!JWKS) {
      JWKS = createRemoteJWKSet(
        new URL(`${authURL}/api/auth/jwks`)
      );
    }

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: authURL,
      audience: authURL,
    });

    if (!payload.email) {
      return res.status(401).json({
        message: "Invalid token: email missing",
      });
    }

    req.user = payload;

    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = verifyToken;
