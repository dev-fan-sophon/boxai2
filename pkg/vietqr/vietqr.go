package vietqr

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
)

const maxTransferAmount int64 = 500_000_000

// Payload builds a dynamic NAPAS VietQR bank-transfer payload using EMVCo TLV.
func Payload(bankBIN, accountNumber string, amountVND int64, purpose string) (string, error) {
	if len(bankBIN) != 6 || !digits(bankBIN) {
		return "", errors.New("bank BIN must contain exactly 6 digits")
	}
	if accountNumber == "" || len(accountNumber) > 19 || !digits(accountNumber) {
		return "", errors.New("account number must contain 1 to 19 digits")
	}
	if amountVND <= 0 || amountVND >= maxTransferAmount {
		return "", errors.New("amount must be a positive integer below 500000000 VND")
	}
	purpose = strings.ToUpper(strings.TrimSpace(purpose))
	if purpose == "" || len(purpose) > 25 || !alphaNumeric(purpose) {
		return "", errors.New("purpose must contain 1 to 25 uppercase letters or digits")
	}

	beneficiary := tlv("00", bankBIN) + tlv("01", accountNumber)
	merchantAccount := tlv("00", "A000000727") + tlv("01", beneficiary) + tlv("02", "QRIBFTTA")
	payload := tlv("00", "01") + tlv("01", "12") + tlv("38", merchantAccount) +
		tlv("53", "704") + tlv("54", strconv.FormatInt(amountVND, 10)) + tlv("58", "VN") +
		tlv("62", tlv("08", purpose)) + "6304"
	return payload + fmt.Sprintf("%04X", crc16([]byte(payload))), nil
}

func tlv(id, value string) string { return fmt.Sprintf("%s%02d%s", id, len(value), value) }

func digits(value string) bool {
	for _, r := range value {
		if r < '0' || r > '9' {
			return false
		}
	}
	return true
}

func alphaNumeric(value string) bool {
	for _, r := range value {
		if (r < 'A' || r > 'Z') && (r < '0' || r > '9') {
			return false
		}
	}
	return true
}

func crc16(data []byte) uint16 {
	crc := uint16(0xffff)
	for _, b := range data {
		crc ^= uint16(b) << 8
		for range 8 {
			if crc&0x8000 != 0 {
				crc = crc<<1 ^ 0x1021
			} else {
				crc <<= 1
			}
		}
	}
	return crc
}
