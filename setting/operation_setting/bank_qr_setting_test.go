package operation_setting

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBankQRConfigChangesArePublishedAsOneSnapshot(t *testing.T) {
	original := GetBankQRSetting()
	t.Cleanup(func() { SetBankQRSetting(original) })

	require.NoError(t, UpdateBankQRConfigField("bank_name", "New Bank"))
	assert.Equal(t, original.BankName, GetBankQRSetting().BankName)

	PublishBankQRSetting()
	assert.Equal(t, "New Bank", GetBankQRSetting().BankName)
}

func TestIsBankQRConfigured(t *testing.T) {
	original := GetBankQRSetting()
	originalDisplay := generalSetting.QuotaDisplayType
	originalRate := USDExchangeRate
	t.Cleanup(func() {
		SetBankQRSetting(original)
		generalSetting.QuotaDisplayType, USDExchangeRate = originalDisplay, originalRate
	})

	setting := BankQRSetting{
		Enabled: true, BankName: "Vietcombank", BankBIN: "970436", AccountNumber: "123456789",
		AccountName: "BOX AI", MinTopUp: 5, TransferPrefix: " box-ai_ ",
	}
	SetBankQRSetting(setting)
	generalSetting.QuotaDisplayType = QuotaDisplayTypeVND
	USDExchangeRate = 26000
	assert.True(t, IsBankQRConfigured())
	assert.Equal(t, "BOXAI", NormalizeBankQRTransferPrefix(setting.TransferPrefix))

	setting.BankBIN = "97043"
	SetBankQRSetting(setting)
	assert.False(t, IsBankQRConfigured())
	setting.BankBIN = "970436"
	SetBankQRSetting(setting)
	generalSetting.QuotaDisplayType = QuotaDisplayTypeUSD
	assert.False(t, IsBankQRConfigured())
	generalSetting.QuotaDisplayType = QuotaDisplayTypeVND
	USDExchangeRate = 0
	assert.False(t, IsBankQRConfigured())
}
