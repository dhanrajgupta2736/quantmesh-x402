import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_rich_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    NAVY_BG = RGBColor(11, 15, 25)
    CARD_BG = RGBColor(19, 27, 44)
    CYAN_ACCENT = RGBColor(6, 182, 212)
    PURPLE_ACCENT = RGBColor(168, 85, 247)
    GREEN_ACCENT = RGBColor(16, 185, 129)
    WHITE = RGBColor(255, 255, 255)
    LIGHT_GRAY = RGBColor(203, 213, 225)
    BORDER_COLOR = RGBColor(30, 41, 59)

    blank_layout = prs.slide_layouts[6]

    def set_dark_background(slide):
        bg = slide.background
        fill = bg.fill
        fill.solid()
        fill.fore_color.rgb = NAVY_BG

    def add_header(slide, title_text, category_text="AlgoVerse 2026 — PS0404"):
        txBox = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11), Inches(0.4))
        tf = txBox.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = category_text.upper()
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = CYAN_ACCENT
        
        txBox2 = slide.shapes.add_textbox(Inches(0.8), Inches(0.75), Inches(11.5), Inches(0.8))
        tf2 = txBox2.text_frame
        tf2.word_wrap = True
        p2 = tf2.paragraphs[0]
        p2.text = title_text
        p2.font.size = Pt(24)
        p2.font.bold = True
        p2.font.color.rgb = WHITE

    def add_card(slide, left, top, width, height, title, content_bullets, accent_color=CYAN_ACCENT):
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        shape.fill.solid()
        shape.fill.fore_color.rgb = CARD_BG
        shape.line.color.rgb = BORDER_COLOR
        shape.line.width = Pt(1.5)

        txBox = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.2), width - Inches(0.4), height - Inches(0.4))
        tf = txBox.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = accent_color

        for bullet in content_bullets:
            p_b = tf.add_paragraph()
            p_b.text = bullet
            p_b.font.size = Pt(12)
            p_b.font.color.rgb = LIGHT_GRAY
            p_b.space_before = Pt(6)

    # Image asset paths
    base_dir = r"C:\Users\HP\.gemini\antigravity-ide\brain\8517252d-b8a0-4ca9-a512-997aedae3c88"
    img_paths = {
        1: os.path.join(base_dir, "slide1_title_banner_1786116609864.png"),
        2: os.path.join(base_dir, "slide2_problem_illustration_1786116632022.png"),
        3: os.path.join(base_dir, "slide3_solution_diagram_1786116653529.png"),
        4: os.path.join(base_dir, "slide4_business_infographic_1786116674400.png"),
        5: os.path.join(base_dir, "slide5_x402_flowchart_1786116695114.png"),
        6: os.path.join(base_dir, "slide6_architecture_blueprint_1786116718392.png"),
        7: os.path.join(base_dir, "slide7_demo_screenshot_1786116740256.png"),
        8: os.path.join(base_dir, "slide8_differentiation_chart_1786116763192.png"),
        9: os.path.join(base_dir, "slide9_completeness_dashboard_1786116783880.png"),
        10: os.path.join(base_dir, "slide10_impact_network_1786116803604.png"),
    }

    # -------------------------------------------------------------
    # SLIDE 1: Title Slide (with Cyberpunk 3D Banner Image)
    # -------------------------------------------------------------
    slide1 = prs.slides.add_slide(blank_layout)
    set_dark_background(slide1)
    
    # Left Content
    tb = slide1.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(6.5), Inches(5.0))
    tf = tb.text_frame
    tf.word_wrap = True
    
    p = tf.paragraphs[0]
    p.text = "QuantMesh x402"
    p.font.size = Pt(44)
    p.font.bold = True
    p.font.color.rgb = CYAN_ACCENT

    p2 = tf.add_paragraph()
    p2.text = "Decentralized AI Micropayment Signal Router on Algorand"
    p2.font.size = Pt(20)
    p2.font.color.rgb = WHITE
    p2.space_before = Pt(10)

    p3 = tf.add_paragraph()
    p3.text = "Track: PS0404 — Atomic Multi-Agent Service Router"
    p3.font.size = Pt(15)
    p3.font.bold = True
    p3.font.color.rgb = PURPLE_ACCENT
    p3.space_before = Pt(20)

    p4 = tf.add_paragraph()
    p4.text = "Team: QuantMesh Innovators\nCollege: CSBS Dept., BV(DU)COE, Pune\nEvent: AlgoVerse 2026 Hackathon"
    p4.font.size = Pt(13)
    p4.font.color.rgb = LIGHT_GRAY
    p4.space_before = Pt(25)

    # Right Banner Image
    if os.path.exists(img_paths[1]):
        slide1.shapes.add_picture(img_paths[1], Inches(7.5), Inches(1.5), Inches(5.0), Inches(5.0))

    # -------------------------------------------------------------
    # SLIDE 2: Problem Statement & Motivation
    # -------------------------------------------------------------
    slide2 = prs.slides.add_slide(blank_layout)
    set_dark_background(slide2)
    add_header(slide2, "Problem Statement & Real-World Motivation")

    add_card(slide2, Inches(0.8), Inches(1.8), Inches(6.0), Inches(5.0), 
             "The 3 Major DeFi Trading Problems", 
             ["1. Subscription Fatigue: Crypto signal APIs cost $100–$500/month even for low-frequency traders.",
              "2. Single-AI Hallucination Risk: Single-model indicators misread market regime shifts and cause trading losses.",
              "3. Multi-Agent Payment Friction: Querying multiple paid APIs requires multiple gas fees and manual transactions."], 
             CYAN_ACCENT)

    if os.path.exists(img_paths[2]):
        slide2.shapes.add_picture(img_paths[2], Inches(7.1), Inches(1.8), Inches(5.4), Inches(5.0))

    # -------------------------------------------------------------
    # SLIDE 3: Proposed Solution / Idea
    # -------------------------------------------------------------
    slide3 = prs.slides.add_slide(blank_layout)
    set_dark_background(slide3)
    add_header(slide3, "Proposed Solution: Multi-Agent Consensus Router")

    add_card(slide3, Inches(0.8), Inches(1.8), Inches(6.0), Inches(5.0), 
             "⚡ Pay-Per-Use Consensus Architecture", 
             ["• Flat $0.007 USDC/ALGO per fused market signal.",
              "• Zero-Fee Guarantee: Pre-execution gating returns HTTP 502 & $0 fee if any worker fails.",
              "• 4 Specialized Sub-Agents:",
              "   - Worker A: FinBERT Financial Sentiment NLP",
              "   - Worker B: CoinGecko On-Chain Whale Flow",
              "   - Worker C: Technical Indicators (RSI, SMA, MACD)",
              "   - Worker D: Weighted Consensus Fusion Engine"], 
             PURPLE_ACCENT)

    if os.path.exists(img_paths[3]):
        slide3.shapes.add_picture(img_paths[3], Inches(7.1), Inches(1.8), Inches(5.4), Inches(5.0))

    # -------------------------------------------------------------
    # SLIDE 4: Identified Paying User & Business Model
    # -------------------------------------------------------------
    slide4 = prs.slides.add_slide(blank_layout)
    set_dark_background(slide4)
    add_header(slide4, "Paying Users & Sustainable Unit Economics")

    add_card(slide4, Inches(0.8), Inches(1.8), Inches(6.0), Inches(5.0), 
             "💰 Unit Economics & Revenue Strategy", 
             ["• User Payment: $0.0070 USDC per signal call.",
              "• Worker Payouts: $0.0060 total ($0.002 A, $0.002 B, $0.001 C, $0.001 D).",
              "• Router Net Profit: $0.0010 USDC per call (14.3% Profit Margin).",
              "• Target Market: Trading bots, Telegram signal services, DEX interfaces, and AI agents."], 
             GREEN_ACCENT)

    if os.path.exists(img_paths[4]):
        slide4.shapes.add_picture(img_paths[4], Inches(7.1), Inches(1.8), Inches(5.4), Inches(5.0))

    # -------------------------------------------------------------
    # SLIDE 5: x402 Payment Flow (Technical Core)
    # -------------------------------------------------------------
    slide5 = prs.slides.add_slide(blank_layout)
    set_dark_background(slide5)
    add_header(slide5, "x402 Technical Protocol Flow (Challenge → Sign → Retry → Settle)")

    add_card(slide5, Inches(0.8), Inches(1.8), Inches(5.5), Inches(5.0), 
             "🔄 4-Step Payment Negotiation", 
             ["1. Probe Request: Client sends POST /orchestrate without payment.",
              "2. HTTP 402 Challenge: Server pre-executes agents & returns 402 + headers (payTo, price).",
              "3. Lute Signature: Client signs 5-txn group with indexesToSign=[0].",
              "4. Settle & Receipt: GoPlausible verifies & settles in 1 atomic block."], 
             CYAN_ACCENT)

    if os.path.exists(img_paths[5]):
        slide5.shapes.add_picture(img_paths[5], Inches(6.6), Inches(1.8), Inches(5.9), Inches(5.0))

    # -------------------------------------------------------------
    # SLIDE 6: Architecture & Tech Stack
    # -------------------------------------------------------------
    slide6 = prs.slides.add_slide(blank_layout)
    set_dark_background(slide6)
    add_header(slide6, "Full-Stack System Architecture")

    add_card(slide6, Inches(0.8), Inches(1.8), Inches(5.5), Inches(5.0), 
             "🛠️ Technology Stack Components", 
             ["• Frontend: Next.js 16 + Tailwind CSS Glassmorphism + @txnlab/use-wallet-react.",
              "• Gateway: Hono.js Orchestrator on AWS EC2.",
              "• Facilitator: GoPlausible Public Facilitator Client (/verify & /settle).",
              "• Blockchain: Algorand AVM Testnet, Testnet USDC ASA 10458941.",
              "• Microservices: FastAPI (FinBERT) + n8n Cloud workflows."], 
             PURPLE_ACCENT)

    if os.path.exists(img_paths[6]):
        slide6.shapes.add_picture(img_paths[6], Inches(6.6), Inches(1.8), Inches(5.9), Inches(5.0))

    # -------------------------------------------------------------
    # SLIDE 7: Demo Screenshots & Transaction Proof
    # -------------------------------------------------------------
    slide7 = prs.slides.add_slide(blank_layout)
    set_dark_background(slide7)
    add_header(slide7, "On-Chain Transaction Proof & Live UI Demo")

    add_card(slide7, Inches(0.8), Inches(1.8), Inches(5.5), Inches(5.0), 
             "🔗 Live Algorand Testnet Verification", 
             ["• Router Address: 4DTSNS35EP...JDEHUHUNFR3KJGPO4",
              "• Testnet USDC ASA ID: 10458941",
              "• 5-Txn Atomic Payout Group executed in 1 block.",
              "• Lora Explorer Link: https://lora.algokit.io/testnet",
              "• SHA-256 Digest: sha256(token:score:verdict:txId:timestamp)."], 
             GREEN_ACCENT)

    if os.path.exists(img_paths[7]):
        slide7.shapes.add_picture(img_paths[7], Inches(6.6), Inches(1.8), Inches(5.9), Inches(5.0))

    # -------------------------------------------------------------
    # SLIDE 8: Innovation & Differentiation
    # -------------------------------------------------------------
    slide8 = prs.slides.add_slide(blank_layout)
    set_dark_background(slide8)
    add_header(slide8, "Innovation & Competitive Differentiation")

    add_card(slide8, Inches(0.8), Inches(1.8), Inches(5.5), Inches(5.0), 
             "⚖️ Traditional vs. QuantMesh x402", 
             ["• $300/mo Subscriptions vs $0.007 Pay-Per-Use.",
              "• Pay Upfront for Dead APIs vs Zero-Fee Guarantee.",
              "• Single-Model Bias vs 4-Agent Consensus Mesh.",
              "• Centralized Server vs Algorand Atomic 5-Txn Settlement."], 
             CYAN_ACCENT)

    if os.path.exists(img_paths[8]):
        slide8.shapes.add_picture(img_paths[8], Inches(6.6), Inches(1.8), Inches(5.9), Inches(5.0))

    # -------------------------------------------------------------
    # SLIDE 9: Completeness & Functionality
    # -------------------------------------------------------------
    slide9 = prs.slides.add_slide(blank_layout)
    set_dark_background(slide9)
    add_header(slide9, "Completeness Status & Working Deliverables")

    add_card(slide9, Inches(0.8), Inches(1.8), Inches(5.5), Inches(5.0), 
             "✅ Completed vs 🚀 Planned Scope", 
             ["✅ 100% Live on AWS EC2 & Next.js dashboard.",
              "✅ HTTP 402 Probe-Challenge-Sign-Retry flow.",
              "✅ GoPlausible Facilitator /verify & /settle.",
              "✅ Lute Wallet integration with indexesToSign=[0].",
              "🚀 Mainnet deployment (algorand:mainnet + ASA 315667040).",
              "🚀 Developer portal for registering 3rd-party worker nodes."], 
             GREEN_ACCENT)

    if os.path.exists(img_paths[9]):
        slide9.shapes.add_picture(img_paths[9], Inches(6.6), Inches(1.8), Inches(5.9), Inches(5.0))

    # -------------------------------------------------------------
    # SLIDE 10: Real-World Impact & Scalability
    # -------------------------------------------------------------
    slide10 = prs.slides.add_slide(blank_layout)
    set_dark_background(slide10)
    add_header(slide10, "Real-World Impact, Scalability & Mainnet Readiness")

    add_card(slide10, Inches(0.8), Inches(1.8), Inches(5.5), Inches(5.0), 
             "🌐 Ecosystem Impact & Mainnet Flip", 
             ["• Empowers autonomous AI agents with machine payments.",
              "• Monetizes independent AI models on Algorand.",
              "• Mainnet Flip: Single flag switch to algorand:mainnet and Mainnet USDC ASA 315667040.",
              "• Algorand sub-3s finality & low fees enable high-frequency scaling."], 
             PURPLE_ACCENT)

    if os.path.exists(img_paths[10]):
        slide10.shapes.add_picture(img_paths[10], Inches(6.6), Inches(1.8), Inches(5.9), Inches(5.0))

    output_pptx = os.path.join("docs", "AlgoVerse2026_QuantMesh_x402_Official_Pitch.pptx")
    prs.save(output_pptx)
    print(f"Rich presentation generated successfully at: {os.path.abspath(output_pptx)}")

if __name__ == "__main__":
    create_rich_presentation()
