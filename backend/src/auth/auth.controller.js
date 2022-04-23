/**
 * /auth APIs
 * 주석처리되어 있는 코드들은 모두 구현과 관련없이 참고용으로만 써야함.
 * 완전히 다른 방식으로 구현해야할 수도 있음.
 *
 * @format
 */

const express = require("express");
const { StatusCodes } = require("http-status-codes");
const router = express.Router();
const AuthService = require("./auth.service");
const authService = new AuthService();

const jwtUtil = require("../common/jwt-util");
// 아래와 jwt 인증이 필요한 부분에서 미들웨어로 사용가능.
// 아래 작성 후에 라우터를 작성하면 req.walletAddress 와 같이 접근 가능
// router.post("/connect", authJwtMiddleware);

/**
 * WalletAddress와 signature를 request body로 받아 인증을 거쳐 jwt access token refresh token 반환
 */
router.post("/connect", async function (req, res) {
  const walletAddress = req.body["walletAddress"];
  const signature = req.body["signature"];

  const { statusCode, responseBody } =
    await authService.verifyAddressBySignature(signature, walletAddress);
  if (statusCode == StatusCodes.OK) {
    const refreshToken = await jwtUtil.refresh(walletAddress);
    res.cookie("refreshtoken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
    });
  }
  res.statusCode = statusCode;
  res.send(responseBody);
});

/**
 * 사용자 지갑 주소를 입력받으면 user 추가. 기본적인 public key값 검증이 이루어짐
 */
router.post("/connect/:walletAddress", async function (req, res) {
  const walletAddress = req.params["walletAddress"];
  const { statusCode, responseBody } =
    await authService.createUserByWalletAddress(walletAddress);

  res.statusCode = statusCode;
  res.send(responseBody);
});

/**
 * Refresh token을 이용해서 유효한 토큰이면 Access Token을 반환 받음.
 */
router.get("/refresh", async function (req, res) {
  const refreshToken = req.cookies["refreshtoken"];
  const walletAddress = req.body["walletAddress"];

  const { statusCode, responseBody } = await authService.refreshAccessToken(
    walletAddress,
    refreshToken,
  );
  res.statusCode = statusCode;
  res.send(responseBody);
});

/**
 * 사용자 지갑 주소를 입력받으면 user를 반환.
 */
router.get("/connect/:walletAddress", async function (req, res) {
  const walletAddress = req.params["walletAddress"];
  const { statusCode, responseBody } = await authService.getUserByWalletAddress(
    walletAddress,
  );
  res.statusCode = statusCode;
  res.send(responseBody);
});

/**
 * 사용자 지갑 주소를 입력받으면 sign할 평문을 반환. 추가로 nonce를 cookie로 전달.
 */
router.get("/sign/:walletAddress", async function (req, res) {
  const walletAddress = req.params["walletAddress"];
  const { statusCode, responseBody } =
    await authService.getSignMessageByWalletAddress(walletAddress);
  res.statusCode = statusCode;
  res.send(responseBody);
});

/**
 * 트위치 OAuth 를 통한 정보 수정.
 * @TODO Twitch 뿐만 아닌 다른 platform 별 switch로 동작하기 변경. jwt middleware를 사용하도록 변경
 */
router.post("/oauth", async function (req, res) {
  const walletAddress = req.body["walletAddress"];
  const code = req.body["code"];

  const { statusCode, responseBody } = await authService.insertUserInfo(
    walletAddress,
    code,
  );

  //res send
  res.statusCode = statusCode;
  res.send(responseBody);
});

module.exports = router;
