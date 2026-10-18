#!/usr/bin/env python3
"""Insert a local, offline QR in a PENNY BOX poster after explicit steward approval."""
import argparse
import ipaddress
from pathlib import Path
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

SVG = 'http://www.w3.org/2000/svg'
ET.register_namespace('', SVG)

def approved_url(value):
    u = urlparse(value)
    if u.scheme != 'https' or not u.hostname or u.username or u.password or u.fragment or len(value)>400:
        raise ValueError('A steward-approved HTTPS destination without credentials or fragments is required')
    if u.port not in (None,443):
        raise ValueError('Only standard HTTPS URLs are accepted')
    host=u.hostname.lower()
    if host=='localhost' or host.endswith(('.local','.invalid','.test','.example')) or '.' not in host:
        raise ValueError('Placeholder/private host refused')
    try:
        ipaddress.ip_address(host)
    except ValueError:
        pass
    else:
        raise ValueError('IP addresses cannot be a church-owned domain')
    return value

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('url',help='A real public HTTPS page approved for this box')
    parser.add_argument('--approved-by-steward',action='store_true',help='Explicit human approval')
    parser.add_argument('--output',required=True,help='New SVG output path')
    a=parser.parse_args()
    if not a.approved_by_steward:
        parser.error('Require --approved-by-steward; blank QR is safer before approval')
    try:
        url=approved_url(a.url)
    except ValueError as e:
        parser.error(str(e))
    output=Path(a.output).expanduser().resolve()
    if output.suffix.lower()!='.svg' or output.exists():
        parser.error('Output must be a new SVG file; refusing to overwrite')
    try:
        import qrcode
    except ImportError:
        parser.error("Install optional offline dependency: python3 -m pip install 'qrcode[pil]'")
    root=ET.parse(Path(__file__).resolve().parent.parent/'assets'/'poster-letter.svg').getroot()
    target=next((x for x in root if x.get('id')=='qr-placeholder'),None)
    if target is None:
        parser.error('QR placeholder missing from poster')
    pos=list(root).index(target)
    root.remove(target)
    qr=qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H,box_size=1,border=4)
    qr.add_data(url)
    qr.make(fit=True)
    matrix=qr.get_matrix()
    g=ET.Element(f'{{{SVG}}}g',{'id':'steward-approved-qr'})
    ET.SubElement(g,f'{{{SVG}}}rect',{'x':'69','y':'708','width':'244','height':'244','rx':'8','fill':'#ffffff','stroke':'#bf8550','stroke-width':'3'})
    cells=ET.SubElement(g,f'{{{SVG}}}g',{'transform':f'translate(75 714) scale({232/len(matrix)})'})
    for y,row in enumerate(matrix):
        for x,on in enumerate(row):
            if on:
                ET.SubElement(cells,f'{{{SVG}}}rect',{'x':str(x),'y':str(y),'width':'1.01','height':'1.01','fill':'#172d26'})
    root.insert(pos,g)
    with output.open('xb') as handle:
        ET.ElementTree(root).write(handle,encoding='utf-8',xml_declaration=True)
    print('Generated: '+str(output)+'. Scan-test before use; no live site was created.')

if __name__=='__main__':
    main()
