#!/usr/bin/env python3
"""Offline QR code generator for a steward-approved HTTPS PENNY Box page.
Optional dependency: python3 -m pip install 'qrcode[pil]'
"""
import argparse
from pathlib import Path
from urllib.parse import urlparse

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url", help="Public HTTPS page approved by the steward")
    parser.add_argument("--output", default="penny-box-qr.svg")
    args = parser.parse_args()
    parsed = urlparse(args.url)
    if (parsed.scheme != "https" or not parsed.netloc or parsed.username or
            parsed.password or parsed.fragment or len(args.url) > 450):
        parser.error("Only a short public HTTPS destination with no credentials is allowed")
    path = Path(args.output)
    if path.exists() or path.suffix.lower() != ".svg":
        parser.error("Output must be a new .svg file, never overwrite one")
    try:
        import qrcode
        from qrcode.image.svg import SvgPathImage
    except ImportError:
        parser.error("Install optional qrcode: python3 -m pip install 'qrcode[pil]'")
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M,
                      box_size=8, border=4)
    qr.add_data(args.url)
    qr.make(fit=True)
    qr.make_image(image_factory=SvgPathImage).save(str(path))
    print("Created " + str(path) + ". Scan-test before public use; no site was deployed.")

if __name__ == "__main__":
    main()
