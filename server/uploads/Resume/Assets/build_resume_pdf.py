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
PDF = r'c:\Users\lovel\OneDrive\Desktop\Resume\Assets\ARAVINDHAN_Resume.pdf'
doc = SimpleDocTemplate(PDF, pagesize=A4,
    topMargin=0.5*cm, bottomMargin=0.5*cm,
    leftMargin=1.2*cm, rightMargin=1.2*cm)
PW = A4[0] - 2 * 1.2 * cm   # usable page width

# ── Styles ────────────────────────────────────────────────────────────────────
def ps(name, fn=None, sz=9, clr=BLK, align=TA_LEFT, sb=0, sa=1, ld=None):
    return ParagraphStyle(name, fontName=fn or RG, fontSize=sz, textColor=clr,
                          alignment=align, spaceBefore=sb, spaceAfter=sa,
                          leading=ld or round(sz * 1.28))

LINK_CLR = colors.HexColor('#1A56C4')  # clickable link colour

S = {
    'name':  ps('name',  BD,  22.5, NAVY,  TA_CENTER, 0, 2, 26),
    'role':  ps('role',  BD,  11.5, BLUE,  TA_CENTER, 0, 2, 14.5),
    'ctct':  ps('ctct',  RG, 9.5, MGREY, TA_CENTER, 0, 4, 12.5),
    'sec':   ps('sec',   BD, 10.5, NAVY,  TA_LEFT,   5, 1, 13.5),
    'jt':    ps('jt',    BD, 10.5, BLK,   TA_LEFT,   3, 1, 13.5),
    'co':    ps('co',    IT, 9.5, MGREY, TA_LEFT,   0, 1, 11.5),
    'body':  ps('body',  RG, 10, DGREY, TA_JUSTIFY,1, 2, 13.5),
    'bul':   ParagraphStyle('bul', fontName=RG, fontSize=9.5, textColor=BLK,
                            spaceBefore=0, spaceAfter=1, leading=12,
                            leftIndent=11, firstLineIndent=-11),
    'skl':   ps('skl',   RG, 9.5, BLK,   TA_LEFT,   0, 0, 11.5),
    'sklhd': ps('sklhd', BD, 9.5, NAVY,  TA_LEFT,   0, 1, 11.5),
    'ptit':  ps('ptit',  BD, 10, NAVY, TA_LEFT,   4, 0, 12.5),
    'einst': ps('einst', BD, 9.5, BLK,   TA_LEFT,   3, 0, 11.5),
    'emeta': ps('emeta', IT, 9, MGREY,TA_LEFT,   0, 1, 10.5),
    'kw':    ps('kw',    RG, 9, DGREY,TA_LEFT,   0, 0, 10.5),
}

# ── Helpers ───────────────────────────────────────────────────────────────────
def hr(thick=0.5):
    return HRFlowable(width='100%', thickness=thick, color=NAVY,
                      spaceBefore=1, spaceAfter=0)

def section(text):
    return [hr(), Paragraph(text.upper(), S['sec'])]

def bul(text):
    return Paragraph(f'\u2022\u2002{text}', S['bul'])

def sk(label, val):
    return Paragraph(
        f'<b><font color="#1B3A6B">{label}:</font></b>\u00a0{val}', S['skl'])

# ── Story ─────────────────────────────────────────────────────────────────────
story = []

# Header
story += [
    Paragraph('ARAVINDHAN S', S['name']),
    Paragraph('QA AUTOMATION ENGINEER', S['role']),
    Paragraph('Selenium\u2002|\u2002Playwright\u2002|\u2002CI/CD\u2002|\u2002'
              'API Testing\u2002|\u2002TOSCA (Learning)', S['ctct']),
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
    'QA Automation Engineer with internship experience at Larsen &amp; Toubro, where I built '
    'Playwright &amp; Selenium frameworks integrated with CI/CD that reduced regression testing time by 40%. '
    'Skilled in test planning, design, execution, failure analysis, and defect lifecycle management across Agile sprints. '
    'Passionate about building scalable test automation and transitioning into model-based testing with Tricentis TOSCA.',
    S['body']))

# Work Experience
story += section('Work Experience')
story.append(Paragraph(
    'Automation Test Engineer Intern\u2002\u2002|\u2002\u2002Feb 2025 \u2013 May 2025', S['jt']))
story.append(Paragraph(
    'Larsen &amp; Toubro\u2002\u00b7\u2002Chennai', S['co']))
story.append(Paragraph(
    '<b><font color="#1B3A6B">Tech Stack:</font></b>\u2002'
    'Playwright, Selenium, Java, Cucumber, Jenkins, Git', S['co']))
for b in [
    'Built automated test scripts using Playwright and Selenium, covering 80+ user journeys across login flows, form submissions, and UI-critical paths',
    'Developed data-driven tests with Cucumber BDD and reusable page objects, keeping the framework easy to maintain across sprint changes',
    'Hooked the suite into CI/CD, cutting regression testing time by ~40% and removing most manual smoke checks before each release',
    'Ran structured failure analysis on failing test runs, documented root causes, and raised defect reports through the team\'s incident management process',
    'Joined Agile ceremonies and flagged automation coverage gaps before regression cycles, reducing last-minute test blockers significantly',
    'Studied Tricentis TOSCA model-based testing alongside active project work as part of ongoing self-directed learning',
]:
    story.append(bul(b))

# Technical Skills — simple inline layout
story += section('Technical Skills')

skill_style = ParagraphStyle('skl_inline', fontName=RG, fontSize=10,
    textColor=BLK, leading=13.5, spaceBefore=1, spaceAfter=1.5)

skills = [
    ('Automation',           'Selenium WebDriver, Playwright, Cucumber BDD, TestNG / JUnit, Tricentis TOSCA (Learning)'),
    ('Languages',            'Java, JavaScript, TypeScript, HTML, CSS'),
    ('API &amp; Database',   'REST API Testing, Postman, JSON Validation, SQL (MySQL)'),
    ('Framework &amp; Practices', 'Page Object Model, Data-Driven Testing, BDD, Test Planning, Defect Lifecycle'),
    ('DevOps &amp; Tools',   'Git, GitHub, Jenkins, Maven, CI/CD Pipelines'),
    ('Methodologies',        'Agile / Scrum, SDLC / STLC, Cross-Browser, Regression &amp; Smoke Testing'),
]
for label, value in skills:
    story.append(Paragraph(
        f'<b><font color="#1B3A6B">{label}:</font></b>\u2002{value}',
        skill_style))

# Certifications
story += section('Certifications')
story.append(bul('Tricentis TOSCA Automation Specialist \u2014 In Progress (2026)'))
story.append(bul('Larsen &amp; Toubro \u2013 Automation Testing Internship Certificate (2025)'))

# Projects
story += section('Projects')
for ptit, pbuls in [
    ('Web Application Automation Framework', [
        'Designed a reusable Playwright/Selenium framework running smoke and regression suites independently across dev, staging, and production',
        'Executed 100+ automated test runs weekly across environments, catching defects 3x faster than manual cycles',
        'Tracked trends across 3+ sprints; identified a recurring timeout defect that pointed to a backend latency issue, resolved after developer review',
    ]),
    ('E-Commerce Application Automation Testing', [
        'Automated 25+ checkout scenarios covering promo codes, out-of-stock handling, and payment edge cases routinely missed during manual testing',
        'Cross-browser runs on Chrome, Firefox, and Edge surfaced 3 layout regressions not caught by the existing unit test suite',
    ]),
    ('Employee Management System \u2014 Automation Testing', [
        'Validated CRUD operations end-to-end with SQL assertions against the live database, ensuring backend and UI stayed in sync',
        'Integrated the suite into GitHub Actions to run on every pull request \u2014 caught 5 regressions before they reached the main branch',
    ]),
]:
    story.append(Paragraph(ptit, S['ptit']))
    for b in pbuls:
        story.append(bul(b))

# Education
story += section('Education')
for inst, deg, period in [
    ('Sri Venkateshwaraa College of Engineering &amp; Technology',
     'B.Tech \u2014 Computer Science and Engineering', '2021\u20132025  |  Puducherry, India'),
    ('Jawahar Higher Secondary School',
     'Class XII (Senior Secondary)', '2020\u20132021  |  Puducherry, India'),
    ('Jawahar Higher Secondary School',
     'Class X (Secondary School)',  '2018\u20132019  |  Puducherry, India'),
]:
    story.append(Paragraph(inst, S['einst']))
    story.append(Paragraph(f'{deg}\u2002\u00b7\u2002{period}', S['emeta']))

# ── Build ─────────────────────────────────────────────────────────────────────
doc.build(story)
print(f'Saved: {PDF}')
