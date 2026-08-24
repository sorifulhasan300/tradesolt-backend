import app from "./app.js";
import envVars from "./config/env.config.js";

const PORT = envVars.PORT;

app.listen(PORT, () => {
  console.log(`TradeSlot Backend Server running on port ${PORT}`);
});

export default app;
