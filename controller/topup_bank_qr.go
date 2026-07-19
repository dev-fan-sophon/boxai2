package controller

import (
	"crypto/rand"
	"errors"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/pkg/vietqr"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

const (
	maxBankQRTopUpUSD  int64 = 100_000
	maxBankQRAmountVND int64 = 500_000_000
)

func bankQRAmount(amountUSD int64, group string, setting operation_setting.BankQRSetting) (int64, error) {
	if amountUSD < setting.MinTopUp || amountUSD > maxBankQRTopUpUSD {
		return 0, fmt.Errorf("top-up amount must be between %d and %d USD", setting.MinTopUp, maxBankQRTopUpUSD)
	}
	if _, err := model.BankQRQuota(amountUSD); err != nil {
		return 0, fmt.Errorf("top-up amount cannot be credited: %w", err)
	}
	rate := operation_setting.USDExchangeRate
	ratio := common.GetTopupGroupRatio(group)
	discount := 1.0
	if configured, ok := operation_setting.GetPaymentSetting().AmountDiscount[int(amountUSD)]; ok {
		discount = configured
	}
	if rate <= 0 || ratio <= 0 || discount <= 0 || math.IsNaN(rate) || math.IsInf(rate, 0) ||
		math.IsNaN(ratio) || math.IsInf(ratio, 0) || math.IsNaN(discount) || math.IsInf(discount, 0) {
		return 0, errors.New("invalid bank QR exchange rate, group ratio, or discount")
	}
	amount := decimal.NewFromInt(amountUSD).Mul(decimal.NewFromFloat(rate)).
		Mul(decimal.NewFromFloat(ratio)).Mul(decimal.NewFromFloat(discount)).Round(0)
	if !amount.IsPositive() || amount.GreaterThanOrEqual(decimal.NewFromInt(maxBankQRAmountVND)) {
		return 0, errors.New("bank QR transfer amount must be below 500000000 VND")
	}
	return amount.IntPart(), nil
}

func RequestBankQRAmount(c *gin.Context) {
	bankSetting := operation_setting.GetBankQRSetting()
	if !isPaymentComplianceConfirmed() || !operation_setting.IsBankQRSettingConfigured(bankSetting) {
		common.ApiErrorMsg(c, "Bank QR top-up is not enabled")
		return
	}
	var req AmountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "Invalid amount")
		return
	}
	group, err := model.GetUserGroup(c.GetInt("id"), true)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	amountVND, err := bankQRAmount(req.Amount, group, bankSetting)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	common.ApiSuccess(c, gin.H{"amount": amountVND, "currency": "VND"})
}

func RequestBankQRPay(c *gin.Context) {
	bankSetting := operation_setting.GetBankQRSetting()
	if !isPaymentComplianceConfirmed() || !operation_setting.IsBankQRSettingConfigured(bankSetting) {
		common.ApiErrorMsg(c, "Bank QR top-up is not enabled")
		return
	}
	var req AmountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "Invalid amount")
		return
	}
	userID := c.GetInt("id")
	group, err := model.GetUserGroup(userID, true)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	amountVND, err := bankQRAmount(req.Amount, group, bankSetting)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	prefix := operation_setting.NormalizeBankQRTransferPrefix(bankSetting.TransferPrefix)
	var tradeNo string
	for attempts := 0; attempts < 5; attempts++ {
		suffix, randomErr := bankQRRandomSuffix(12)
		if randomErr != nil {
			common.ApiError(c, randomErr)
			return
		}
		tradeNo = prefix + suffix
		if model.GetTopUpByTradeNo(tradeNo) == nil {
			break
		}
		tradeNo = ""
	}
	if tradeNo == "" {
		common.ApiErrorMsg(c, "Unable to create a unique transfer reference")
		return
	}
	payload, err := vietqr.Payload(bankSetting.BankBIN, bankSetting.AccountNumber, amountVND, tradeNo)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	order := &model.TopUp{
		UserId: userID, Amount: req.Amount, Money: float64(amountVND), TradeNo: tradeNo,
		PaymentMethod: model.PaymentMethodBankQR, PaymentProvider: model.PaymentProviderBankQR,
		CreateTime: common.GetTimestamp(), Status: common.TopUpStatusPending,
	}
	if err := order.Insert(); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{
		"trade_no": tradeNo, "transfer_content": tradeNo, "amount": amountVND, "currency": "VND",
		"payload": payload, "bank_name": strings.TrimSpace(bankSetting.BankName), "bank_bin": bankSetting.BankBIN,
		"account_number": bankSetting.AccountNumber, "account_name": strings.TrimSpace(bankSetting.AccountName),
	})
}

func UpdateBankQRSetting(c *gin.Context) {
	var setting operation_setting.BankQRSetting
	if err := common.DecodeJson(c.Request.Body, &setting); err != nil {
		common.ApiErrorMsg(c, "Invalid bank QR settings")
		return
	}
	setting.BankName = strings.TrimSpace(setting.BankName)
	setting.BankBIN = strings.TrimSpace(setting.BankBIN)
	setting.AccountNumber = strings.TrimSpace(setting.AccountNumber)
	setting.AccountName = strings.TrimSpace(setting.AccountName)
	setting.TransferPrefix = operation_setting.NormalizeBankQRTransferPrefix(setting.TransferPrefix)
	if err := operation_setting.ValidateBankQRSetting(setting); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	updates := map[string]string{
		"bank_qr_setting.enabled":         strconv.FormatBool(setting.Enabled),
		"bank_qr_setting.bank_name":       setting.BankName,
		"bank_qr_setting.bank_bin":        setting.BankBIN,
		"bank_qr_setting.account_number":  setting.AccountNumber,
		"bank_qr_setting.account_name":    setting.AccountName,
		"bank_qr_setting.min_topup":       strconv.FormatInt(setting.MinTopUp, 10),
		"bank_qr_setting.transfer_prefix": setting.TransferPrefix,
	}
	err := operation_setting.WithBankQRSettingsUpdate(func() error {
		if err := model.UpdateOptionsBulk(updates); err != nil {
			return err
		}
		operation_setting.SetBankQRSetting(setting)
		return nil
	})
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, setting)
}

func bankQRRandomSuffix(length int) (string, error) {
	const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	for i := range bytes {
		bytes[i] = alphabet[int(bytes[i])%len(alphabet)]
	}
	return string(bytes), nil
}
