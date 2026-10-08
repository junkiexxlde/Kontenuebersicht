#!/usr/bin/env python3
"""Validate the format and MOD-97 checksum of an IBAN supplied as JSON."""

import json
import re
import sys


COUNTRY_LENGTHS = {
    "AD": 24,
    "AL": 28,
    "AT": 20,
    "AZ": 28,
    "BA": 20,
    "BE": 16,
    "BY": 28,
    "BG": 22,
    "CH": 21,
    "CY": 28,
    "CZ": 24,
    "DE": 22,
    "DK": 18,
    "EE": 20,
    "ES": 24,
    "FI": 18,
    "FO": 18,
    "FR": 27,
    "GB": 22,
    "GE": 22,
    "GI": 23,
    "GL": 18,
    "GR": 27,
    "HR": 21,
    "HU": 28,
    "IE": 22,
    "IS": 26,
    "IT": 27,
    "LI": 21,
    "LT": 20,
    "LU": 20,
    "LV": 21,
    "MC": 27,
    "MD": 24,
    "ME": 22,
    "MK": 19,
    "MT": 31,
    "NL": 18,
    "NO": 15,
    "PL": 28,
    "PT": 25,
    "RO": 24,
    "RU": 33,
    "RS": 22,
    "SE": 24,
    "SI": 19,
    "SK": 24,
    "SM": 27,
    "TR": 26,
    "UA": 29,
    "VA": 22,
    "XK": 20,
    "KZ": 20,
}


def validate_iban(value):
    iban = re.sub(r"\s+", "", value).upper()
    if not 15 <= len(iban) <= 34 or not re.fullmatch(r"[A-Z]{2}\d{2}[A-Z0-9]+", iban):
        return False
    if COUNTRY_LENGTHS.get(iban[:2]) != len(iban):
        return False

    rearranged = iban[4:] + iban[:4]
    remainder = 0
    for character in rearranged:
        digits = character if character.isdigit() else str(ord(character) - ord("A") + 10)
        for digit in digits:
            remainder = (remainder * 10 + int(digit)) % 97
    return remainder == 1


def main():
    try:
        payload = json.load(sys.stdin)
        iban = payload.get("iban", "")
        valid = validate_iban(iban) if isinstance(iban, str) else False
        json.dump({"valid": valid}, sys.stdout)
        sys.stdout.write("\n")
    except (json.JSONDecodeError, AttributeError):
        json.dump({"valid": False}, sys.stdout)
        sys.stdout.write("\n")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
