import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, HRFlowable, Table, TableStyle
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ── Register Calibri (Windows system font) ────────────────────────────────────
WF = r'C:\Windows\Fonts'
try:
    pdfmetrics.registerFont(TTFont('Cal',    WF + r'\calibri.ttf'))
    pdfmetrics.registerFont(TTFont('Cal-B',  WF + r'\calibrib.ttf'))
    pdfmetrics.registerFont(TTFont('Cal-I',  WF + r'\calibrii.ttf'))
    pdfmetrics.registerFont(TTFont('Cal-BI', WF + r'\calibriz.ttf'))
    pdfmetrics.registerFontFamily('Cal', normal='Cal', bold='Cal-B',
                                  italic='Cal-I', boldItalic='Cal-BI')
    RG, BD, IT = 'Cal', 'Cal-B', 'Cal-I'
    print('Font: Calibri')
except Exception as e:
    RG = 'Helvetica'; BD = 'Helvetica-Bold'; IT = 'Helvetica-Oblique'
    print(f'Calibri not found — using Helvetica ({e})')

# ── Colors ────────────────────────────────────────────────────────────────────
NAVY  = colors.HexColor('#1B3A6B')
BLUE  = colors.HexColor('#2554BA')
BLK   = colors.HexColor('#1A1A1A')
DGREY = colors.HexColor('#383838')
MGREY = colors.HexColor('#666666')

# ── Document ──────────────────────────────────────────────────────────────────
PDF = r'c:\Users\lovel\OneDrive\Desktop\Resume\Assets\ARAVINDHAN_SoftwareDeveloper_Resume.pdf'
doc = SimpleDocTemplate(PDF, pagesize=A4,
    topMargin=0.5*cm, bottomMargin=0.5*cm,
    leftMargin=1.2*cm, rightMargin=1.2*cm)
PW = A4[0] - 2 * 1.2 * cm   # usable page width

# ── Styles ────────────────────────────────────────────────────────────────────
def ps(name, fn=None, sz=9, clr=BLK, align=TA_LEFT, sb=0, sa=1, ld=None):
    return ParagraphStyle(name, fontName=fn or RG, fontSize=sz, textColor=clr,
                          alignment=align, spaceBefore=sb, spaceAfter=sa,
                          leading=ld or round(sz * 1.28))

S = {
    'name':  ps('name',  BD,  28, NAVY,  TA_CENTER, 0, 4, 32),
    'role':  ps('role',  BD,  14, BLUE,  TA_CENTER, 0, 4, 18),
    'ctct':  ps('ctct',  RG, 11, MGREY, TA_CENTER, 0, 8, 16),
    'sec':   ps('sec',   BD, 13, NAVY,  TA_LEFT,   18, 6, 18),
    'jt':    ps('jt',    BD, 13, BLK,   TA_LEFT,   10, 4, 18),
    'co':    ps('co',    IT, 11, MGREY, TA_LEFT,   0, 4, 15),
    'body':  ps('body',  RG, 12, DGREY, TA_JUSTIFY, 8, 8, 18),
    'bul':   ParagraphStyle('bul', fontName=RG, fontSize=12, textColor=BLK,
                            spaceBefore=4, spaceAfter=4, leading=16,
                            leftIndent=11, firstLineIndent=-11),
    'skl':   ps('skl',   RG, 12, BLK,   TA_LEFT,   4, 4, 16),
    'sklhd': ps('sklhd', BD, 12, NAVY,  TA_LEFT,   0, 4, 16),
    'ptit':  ps('ptit',  BD, 13, NAVY, TA_LEFT,   14, 6, 18),
    'einst': ps('einst', BD, 12, BLK,   TA_LEFT,   10, 4, 16),
    'emeta': ps('emeta', IT, 11.5, MGREY,TA_LEFT,   0, 4, 15),
    'inline':ps('inline',RG, 12, DGREY, TA_LEFT,   6, 8, 18),
}

# ── Helpers ───────────────────────────────────────────────────────────────────
def hr(thick=0.8):
    return HRFlowable(width='100%', thickness=thick, color=NAVY,
                      spaceBefore=4, spaceAfter=2)

def section(text):
    return [hr(), Paragraph(text.upper(), S['sec'])]

def bul(text):
    return Paragraph(f'\u2022\u2002{text}', S['bul'])

# ── Story ─────────────────────────────────────────────────────────────────────
story = []

# Header
story += [
    Paragraph('ARAVINDHAN S', S['name']),
    Paragraph('FRONTEND DEVELOPER (React | TypeScript | JavaScript)', S['role']),
    Paragraph(
        '<a href="mailto:aravindh2003s@gmail.com" color="#666666">aravindh2003s@gmail.com</a>'
        '\u2002|\u2002+91 88385 44167\u2002|\u2002'
        '<a href="https://linkedin.com/in/aravindhan-s-37254b2a2" color="#1A56C4">'
        '<u>linkedin.com/in/aravindhan-s-37254b2a2</u></a>'
        '\u2002|\u2002'
        '<a href="https://github.com/aravindh2003s" color="#1A56C4">'
        '<u>github.com/aravindh2003s</u></a>',
        S['ctct']),
    hr(1.0),
]

# Professional Summary
story += section('Professional Summary')
story.append(Paragraph(
    'Frontend Developer with hands-on experience building responsive, scalable web applications using React, TypeScript, JavaScript, HTML and CSS. '
    'Strong understanding of UI architecture, REST API integration and component-based development. '
    'Experienced working in Agile teams, CI/CD environments and UI automation testing. '
    'Passionate about creating clean, user-friendly interfaces and writing maintainable code.',
    S['body']))

# Tech Stack
story += section('Tech Stack')

skill_style = ParagraphStyle('skl_inline', fontName=RG, fontSize=10,
    textColor=BLK, leading=13, spaceBefore=0.5, spaceAfter=1)

skills = [
    ('Frontend', 'React.js, JavaScript (ES6+), TypeScript, HTML5, CSS3, Responsive Design'),
    ('Backend', 'FastAPI, Node.js, Express.js, REST APIs'),
    ('Database', 'MySQL, MongoDB'),
    ('Testing', 'Playwright, Selenium, Cucumber'),
    ('Tools', 'Git, GitHub, CI/CD, Agile/Scrum'),
]
for label, value in skills:
    story.append(Paragraph(
        f'<b><font color="#1B3A6B">{label}:</font></b>\u2002{value}',
        skill_style))

# Core Frontend Skills — compact inline
story += section('Core Frontend Skills')
story.append(Paragraph(
    'Component-Based Architecture &amp; Reusable UI\u2002\u00b7\u2002'
    'State Management (Context API)\u2002\u00b7\u2002'
    'Cross-Browser Compatibility\u2002\u00b7\u2002'
    'API Integration &amp; Async Data Handling\u2002\u00b7\u2002'
    'Performance Optimization\u2002\u00b7\u2002'
    'Mobile-First Responsive Design',
    S['inline']))

# Experience
story += section('Experience')
story.append(Paragraph(
    'Automation Tester Intern \u2014 Larsen &amp; Toubro, Chennai'
    '\u2002\u2002|\u2002\u2002Feb 2025 \u2013 May 2025', S['jt']))
for b in [
    'Developed automated UI test scripts using Playwright + TypeScript for critical user workflows',
    'Built reusable automation framework using Cucumber BDD, improving test maintainability',
    'Collaborated with developers to identify UI issues early and improve product quality',
    'Integrated automated testing into CI/CD pipelines, reducing manual testing effort by 40%',
    'Performed cross-browser testing to ensure consistent UI behavior',
]:
    story.append(bul(b))

# Projects
story += section('Projects')
for ptit, pbuls in [
    ('E-Commerce Custom T-Shirt Platform (React)', [
        'Developed product browsing, cart and checkout experience',
        'Built dynamic product customization interface',
        'Focused on UX, responsiveness and performance optimization',
    ]),
    ('Employee Management System (React + FastAPI + MySQL)', [
        'Built CRUD dashboard UI to manage employee records',
        'Implemented form validation and API error handling',
    ]),
    ('Portfolio Website (React)', [
        'Built responsive portfolio with authentication and dynamic project display',
    ]),
]:
    story.append(Paragraph(ptit, S['ptit']))
    for b in pbuls:
        story.append(bul(b))

# Education
story += section('Education')
for inst, deg, period in [
    ('Sri Venkateshwaraa College of Engineering and Technology',
     'B.Tech \u2013 Computer Science and Engineering', '2021\u20132025'),
    ('Jawahar Higher Secondary School',
     'Class XII \u2013 Higher Secondary', '2020\u20132021'),
    ('Jawahar Higher Secondary School',
     'Class XI \u2013 Secondary School',  '2018\u20132019'),
]:
    story.append(Paragraph(inst, S['einst']))
    story.append(Paragraph(f'{deg}\u2002\u00b7\u2002{period}', S['emeta']))

# ── Build ─────────────────────────────────────────────────────────────────────
doc.build(story)
print(f'Saved: {PDF}')
