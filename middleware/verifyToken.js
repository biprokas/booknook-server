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

    // Load jose and initialize the public key set
    const { createRemoteJWKSet, jwtVerify } = await import("jose");

    if (!JWKS) {
      JWKS = createRemoteJWKSet(
        new URL("http://localhost:3000/api/auth/jwks")
      );
    }

    // Verify the Better Auth JWT
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: "http://localhost:3000",
      audience: "http://localhost:3000",
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