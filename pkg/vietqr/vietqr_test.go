package vietqr

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPayloadGolden(t *testing.T) {
	payload, err := Payload("970422", "123456789", 260000, "BOXAIABC123")
	require.NoError(t, err)
	assert.Equal(t, "00020101021238530010A0000007270123000697042201091234567890208QRIBFTTA530370454062600005802VN62150811BOXAIABC12363046EEB", payload)
	assert.Equal(t, "6EEB", payload[len(payload)-4:])
}

func TestPayloadValidation(t *testing.T) {
	tests := []struct {
		bin, account string
		amount       int64
		purpose      string
	}{
		{"97042", "123", 1, "ABC"}, {"970422", "12A", 1, "ABC"},
		{"970422", "123", 0, "ABC"}, {"970422", "123", 500_000_000, "ABC"},
		{"970422", "123", 1, "contains-space"}, {"970422", "123", 1, "ABCDEFGHIJKLMNOPQRSTUVWXYZ"},
	}
	for _, tc := range tests {
		_, err := Payload(tc.bin, tc.account, tc.amount, tc.purpose)
		assert.Error(t, err)
	}
}
