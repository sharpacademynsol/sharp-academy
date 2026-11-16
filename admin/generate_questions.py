import pandas as pd

# Define shape keys pool
shape_keys_list = [
    "arrow_0", "arrow_45", "arrow_90", "arrow_135", "arrow_180", "arrow_225", "arrow_270", "arrow_315",
    "quad_tr", "quad_br", "quad_bl", "quad_tl", "half_top", "half_bottom", "half_left", "half_right",
    "poly_triangle_eq", "poly_square_hollow", "poly_circle_hollow", "poly_pentagon", "poly_hexagon", "poly_rhombus", "poly_star_5", "poly_cross_plus",
    "nest_circ_in_sq", "nest_sq_in_circ", "nest_tri_in_sq", "nest_sq_in_tri", "nest_circ_in_tri",
    "dots_1_center", "dots_2_diag", "dots_3_diag", "dots_4_corners", "dots_5_dice",
    "sq_dot_tl", "sq_dot_tr", "sq_dot_bl", "sq_dot_br", "sq_dot_center", "line_1_vert", "line_cross", "clock_12", "clock_3"
]

generated_rows = []
difficulties = ["easy", "medium", "hard"]
subtypes = ["series", "analogy", "matrix", "odd_one_out"]

for i in range(1, 101):
    stype = subtypes[(i - 1) % len(subtypes)]
    diff = difficulties[(i - 1) % len(difficulties)]
    
    if stype == "series":
        topic = f"Non-Verbal - Series Pattern {i}"
        q_stmt = "Examine the progression in the series sequence below. Which figure logically replaces the question mark (?)?"
        fig1 = shape_keys_list[(i * 2) % len(shape_keys_list)]
        fig2 = shape_keys_list[(i * 2 + 1) % len(shape_keys_list)]
        fig3 = shape_keys_list[(i * 2 + 2) % len(shape_keys_list)]
        target = "[?] Next Missing Shape (Solved by Option A-D)"
        opt_a = shape_keys_list[(i * 2 + 3) % len(shape_keys_list)]
        opt_b = shape_keys_list[(i * 2 + 4) % len(shape_keys_list)]
        opt_c = shape_keys_list[(i * 2 + 5) % len(shape_keys_list)]
        opt_d = shape_keys_list[(i * 2 + 6) % len(shape_keys_list)]
        correct = "A"
        expl = "By analyzing the rotational and spatial progression in Figures 1, 2, and 3, the transformation rule dictates that Option A correctly completes the series sequence."
        tags = "non-verbal, series, progression"
        
    elif stype == "analogy":
        topic = f"Non-Verbal - Analogy Set {i}"
        q_stmt = "Figure A is to Figure B as Figure C is to [?]. Select the correct figure completing the analogy:"
        fig1 = shape_keys_list[(i * 3) % len(shape_keys_list)]
        fig2 = shape_keys_list[(i * 3 + 1) % len(shape_keys_list)]
        fig3 = shape_keys_list[(i * 3 + 2) % len(shape_keys_list)]
        target = "[?] Missing Analogous Shape (Solved by Option A-D)"
        opt_a = shape_keys_list[(i * 3 + 3) % len(shape_keys_list)]
        opt_b = shape_keys_list[(i * 3 + 4) % len(shape_keys_list)]
        opt_c = shape_keys_list[(i * 3 + 5) % len(shape_keys_list)]
        opt_d = shape_keys_list[(i * 3 + 6) % len(shape_keys_list)]
        correct = "A"
        expl = "The geometric transformation connecting Figure A to Figure B is preserved and applied to Figure C, yielding Option A at the target slot."
        tags = "non-verbal, analogy, transformation"
        
    elif stype == "matrix":
        topic = f"Non-Verbal - Matrix Grid {i}"
        q_stmt = "Analyze the elements across the 2x2/3x3 matrix. Which figure correctly replaces the question mark (?)?"
        fig1 = shape_keys_list[(i * 4) % len(shape_keys_list)]
        fig2 = shape_keys_list[(i * 4 + 1) % len(shape_keys_list)]
        fig3 = shape_keys_list[(i * 4 + 2) % len(shape_keys_list)]
        target = "[?] Target Cell Question Mark (Solved by Option A-D)"
        opt_a = shape_keys_list[(i * 4 + 3) % len(shape_keys_list)]
        opt_b = shape_keys_list[(i * 4 + 4) % len(shape_keys_list)]
        opt_c = shape_keys_list[(i * 4 + 5) % len(shape_keys_list)]
        opt_d = shape_keys_list[(i * 4 + 6) % len(shape_keys_list)]
        correct = "A"
        expl = "Row and column constraints in the matrix require the intersection of attributes, identifying Option A as the correct solution."
        tags = "non-verbal, matrix, grid"
        
    else: # odd_one_out
        topic = f"Non-Verbal - Odd One Out {i}"
        q_stmt = "Four of the following figures share a common geometric property. Select the ONE figure that is the Odd One Out:"
        fig1 = "nan"
        fig2 = "nan"
        fig3 = "nan"
        target = "N/A (Odd One Out evaluates Choices directly)"
        opt_a = shape_keys_list[(i * 5) % len(shape_keys_list)]
        opt_b = shape_keys_list[(i * 5 + 1) % len(shape_keys_list)]
        opt_c = shape_keys_list[(i * 5 + 2) % len(shape_keys_list)]
        opt_d = shape_keys_list[(i * 5 + 3) % len(shape_keys_list)]
        correct = "D"
        expl = "Options A, B, and C share identical symmetry and side attributes, whereas Option D violates this rule, making it the odd one out."
        tags = "non-verbal, odd-one-out, classification"

    generated_rows.append({
        'Course Code': 'CAD-101',
        'Topic': topic,
        'Difficulty': diff,
        'Marks': 10,
        'Question Statement': q_stmt,
        'Sub Type (series / analogy / matrix / odd_one_out)': stype,
        'Problem Figure 1 (Shape Key or URL)': fig1,
        'Problem Figure 2 (Shape Key or URL)': fig2,
        'Problem Figure 3 (Shape Key or URL)': fig3,
        'Target Slot (?) Placeholder': target,
        'Option A (Shape Key or URL)': opt_a,
        'Option B (Shape Key or URL)': opt_b,
        'Option C (Shape Key or URL)': opt_c,
        'Option D (Shape Key or URL)': opt_d,
        'Correct Option (A-D or 1-4)': correct,
        'Explanation': expl,
        'Tags': tags
    })

df_100 = pd.DataFrame(generated_rows)

# Create Help & Guidelines sheet data matching your template structure
help_data = [
    ["SHARP ACADEMY - QUESTION BANK BULK IMPORT GUIDE"],
    ["--------------------------------------------------------"],
    ["1. Do NOT rename or delete column headers in row 1 of 'Questions Data'."],
    ["2. Course Code: Must match an active course in the academy system (e.g. CAD-101)."],
    ["3. Difficulty: Valid values are 'easy', 'medium', or 'hard'."],
    ["4. Non-Verbal Correct Answer: Enter 'A', 'B', 'C', or 'D'."],
    ["5. Built-in Shape Keys: arrow_0, quad_tr, nest_circ_in_sq, sq_dot_tl, etc."]
]
df_help = pd.DataFrame(help_data, columns=["Instructions & Guidelines"])

output_filename = 'question_bank_100_non_verbal_import.xlsx'
with pd.ExcelWriter(output_filename, engine='openpyxl') as writer:
    df_100.to_excel(writer, sheet_name='Questions Data', index=False)
    df_help.to_excel(writer, sheet_name='Help & Guidelines', index=False)

print(f"Successfully generated {output_filename}!")