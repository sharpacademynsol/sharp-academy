export interface ShapeItem {
  id: string;
  name: string;
  category: "quadrants" | "nested" | "polygons" | "dots" | "lines" | "arrows" | "custom" | string;
  tags: string[];
  svg: string;
  rawId?: number;
  isCustom?: boolean;
  r2_key?: string;
  file_url?: string;
}


const wrapSvg = (innerContent: string): string => {
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%23f8fafc' stroke='%23cbd5e1' stroke-width='2'/>${innerContent}</svg>`;
};

export const SHAPE_CATEGORIES = [
  { id: "all", label: "All Shapes" },
  { id: "quadrants", label: "Shaded Quadrants & Fractions" },
  { id: "nested", label: "Nested & Inset Shapes" },
  { id: "polygons", label: "Geometric Polygons" },
  { id: "dots", label: "Dots & Tracking" },
  { id: "lines", label: "Lines, Crosses & Clocks" },
  { id: "arrows", label: "Directional Arrows" }
] as const;

export const SHAPE_LIBRARY: ShapeItem[] = [
  // --- SHADED QUADRANTS & FRACTIONS ---
  {
    id: "quad_tr",
    name: "Circle - Top-Right Shaded (0°)",
    category: "quadrants",
    tags: ["circle", "quadrant", "shaded", "rotation", "quarter", "pie"],
    svg: wrapSvg("<circle cx='50' cy='50' r='34' fill='none' stroke='%232563eb' stroke-width='3'/><path d='M 50 50 L 50 16 A 34 34 0 0 1 84 50 Z' fill='%232563eb'/>")
  },
  {
    id: "quad_br",
    name: "Circle - Bottom-Right Shaded (90°)",
    category: "quadrants",
    tags: ["circle", "quadrant", "shaded", "rotation", "quarter", "pie"],
    svg: wrapSvg("<circle cx='50' cy='50' r='34' fill='none' stroke='%232563eb' stroke-width='3'/><path d='M 50 50 L 84 50 A 34 34 0 0 1 50 84 Z' fill='%232563eb'/>")
  },
  {
    id: "quad_bl",
    name: "Circle - Bottom-Left Shaded (180°)",
    category: "quadrants",
    tags: ["circle", "quadrant", "shaded", "rotation", "quarter", "pie"],
    svg: wrapSvg("<circle cx='50' cy='50' r='34' fill='none' stroke='%232563eb' stroke-width='3'/><path d='M 50 50 L 50 84 A 34 34 0 0 1 16 50 Z' fill='%232563eb'/>")
  },
  {
    id: "quad_tl",
    name: "Circle - Top-Left Shaded (270°)",
    category: "quadrants",
    tags: ["circle", "quadrant", "shaded", "rotation", "quarter", "pie"],
    svg: wrapSvg("<circle cx='50' cy='50' r='34' fill='none' stroke='%232563eb' stroke-width='3'/><path d='M 50 50 L 16 50 A 34 34 0 0 1 50 16 Z' fill='%232563eb'/>")
  },
  {
    id: "half_top",
    name: "Circle - Top Half Shaded",
    category: "quadrants",
    tags: ["circle", "half", "semicircle", "top", "shaded"],
    svg: wrapSvg("<circle cx='50' cy='50' r='34' fill='none' stroke='%232563eb' stroke-width='3'/><path d='M 16 50 A 34 34 0 0 1 84 50 Z' fill='%232563eb'/>")
  },
  {
    id: "half_bottom",
    name: "Circle - Bottom Half Shaded",
    category: "quadrants",
    tags: ["circle", "half", "semicircle", "bottom", "shaded"],
    svg: wrapSvg("<circle cx='50' cy='50' r='34' fill='none' stroke='%232563eb' stroke-width='3'/><path d='M 16 50 A 34 34 0 0 0 84 50 Z' fill='%232563eb'/>")
  },
  {
    id: "half_left",
    name: "Circle - Left Half Shaded",
    category: "quadrants",
    tags: ["circle", "half", "semicircle", "left", "shaded"],
    svg: wrapSvg("<circle cx='50' cy='50' r='34' fill='none' stroke='%232563eb' stroke-width='3'/><path d='M 50 16 A 34 34 0 0 0 50 84 Z' fill='%232563eb'/>")
  },
  {
    id: "half_right",
    name: "Circle - Right Half Shaded",
    category: "quadrants",
    tags: ["circle", "half", "semicircle", "right", "shaded"],
    svg: wrapSvg("<circle cx='50' cy='50' r='34' fill='none' stroke='%232563eb' stroke-width='3'/><path d='M 50 16 A 34 34 0 0 1 50 84 Z' fill='%232563eb'/>")
  },
  {
    id: "sq_quad_tr",
    name: "Square - Top-Right Quadrant Shaded",
    category: "quadrants",
    tags: ["square", "quadrant", "shaded", "corner"],
    svg: wrapSvg("<rect x='20' y='20' width='60' height='60' fill='none' stroke='%232563eb' stroke-width='3' rx='3'/><rect x='50' y='20' width='30' height='30' fill='%232563eb'/>")
  },
  {
    id: "sq_quad_br",
    name: "Square - Bottom-Right Quadrant Shaded",
    category: "quadrants",
    tags: ["square", "quadrant", "shaded", "corner"],
    svg: wrapSvg("<rect x='20' y='20' width='60' height='60' fill='none' stroke='%232563eb' stroke-width='3' rx='3'/><rect x='50' y='50' width='30' height='30' fill='%232563eb'/>")
  },
  {
    id: "sq_quad_bl",
    name: "Square - Bottom-Left Quadrant Shaded",
    category: "quadrants",
    tags: ["square", "quadrant", "shaded", "corner"],
    svg: wrapSvg("<rect x='20' y='20' width='60' height='60' fill='none' stroke='%232563eb' stroke-width='3' rx='3'/><rect x='20' y='50' width='30' height='30' fill='%232563eb'/>")
  },
  {
    id: "sq_quad_tl",
    name: "Square - Top-Left Quadrant Shaded",
    category: "quadrants",
    tags: ["square", "quadrant", "shaded", "corner"],
    svg: wrapSvg("<rect x='20' y='20' width='60' height='60' fill='none' stroke='%232563eb' stroke-width='3' rx='3'/><rect x='20' y='20' width='30' height='30' fill='%232563eb'/>")
  },
  {
    id: "sq_diag_top",
    name: "Square - Top Triangle Shaded",
    category: "quadrants",
    tags: ["square", "diagonal", "triangle", "shaded"],
    svg: wrapSvg("<rect x='20' y='20' width='60' height='60' fill='none' stroke='%232563eb' stroke-width='3' rx='3'/><polygon points='20,20 80,20 80,80' fill='%232563eb'/>")
  },
  {
    id: "sq_diag_bottom",
    name: "Square - Bottom Triangle Shaded",
    category: "quadrants",
    tags: ["square", "diagonal", "triangle", "shaded"],
    svg: wrapSvg("<rect x='20' y='20' width='60' height='60' fill='none' stroke='%232563eb' stroke-width='3' rx='3'/><polygon points='20,80 80,80 80,20' fill='%232563eb'/>")
  },

  // --- NESTED & INSET SHAPES ---
  {
    id: "nest_circ_in_sq",
    name: "Circle inside Square",
    category: "nested",
    tags: ["nested", "circle", "square", "container", "inner"],
    svg: wrapSvg("<rect x='20' y='20' width='60' height='60' fill='none' stroke='%232563eb' stroke-width='3' rx='4'/><circle cx='50' cy='50' r='20' fill='%233b82f6' fill-opacity='0.25' stroke='%231d4ed8' stroke-width='3'/>")
  },
  {
    id: "nest_sq_in_circ",
    name: "Square inside Circle",
    category: "nested",
    tags: ["nested", "square", "circle", "container", "inner", "inversion"],
    svg: wrapSvg("<circle cx='50' cy='50' r='34' fill='none' stroke='%232563eb' stroke-width='3'/><rect x='32' y='32' width='36' height='36' fill='%233b82f6' fill-opacity='0.25' stroke='%231d4ed8' stroke-width='3' rx='2'/>")
  },
  {
    id: "nest_tri_in_sq",
    name: "Triangle inside Square",
    category: "nested",
    tags: ["nested", "triangle", "square", "container", "inner"],
    svg: wrapSvg("<rect x='20' y='20' width='60' height='60' fill='none' stroke='%232563eb' stroke-width='3' rx='4'/><polygon points='50,26 74,70 26,70' fill='%233b82f6' fill-opacity='0.25' stroke='%231d4ed8' stroke-width='3'/>")
  },
  {
    id: "nest_sq_in_tri",
    name: "Square inside Triangle",
    category: "nested",
    tags: ["nested", "square", "triangle", "container", "inner", "inversion"],
    svg: wrapSvg("<polygon points='50,16 86,80 14,80' fill='none' stroke='%232563eb' stroke-width='3'/><rect x='36' y='46' width='28' height='28' fill='%233b82f6' fill-opacity='0.25' stroke='%231d4ed8' stroke-width='3' rx='2'/>")
  },
  {
    id: "nest_tri_in_circ",
    name: "Triangle inside Circle",
    category: "nested",
    tags: ["nested", "triangle", "circle", "container", "inner"],
    svg: wrapSvg("<circle cx='50' cy='50' r='34' fill='none' stroke='%232563eb' stroke-width='3'/><polygon points='50,22 76,70 24,70' fill='%233b82f6' fill-opacity='0.25' stroke='%231d4ed8' stroke-width='3'/>")
  },
  {
    id: "nest_circ_in_tri",
    name: "Circle inside Triangle",
    category: "nested",
    tags: ["nested", "circle", "triangle", "container", "inner", "inversion"],
    svg: wrapSvg("<polygon points='50,16 86,80 14,80' fill='none' stroke='%232563eb' stroke-width='3'/><circle cx='50' cy='56' r='18' fill='%233b82f6' fill-opacity='0.25' stroke='%231d4ed8' stroke-width='3'/>")
  },
  {
    id: "nest_concentric_circ_2",
    name: "Concentric Circles (2 Rings)",
    category: "nested",
    tags: ["concentric", "circle", "ring", "target"],
    svg: wrapSvg("<circle cx='50' cy='50' r='34' fill='none' stroke='%232563eb' stroke-width='3'/><circle cx='50' cy='50' r='18' fill='none' stroke='%232563eb' stroke-width='3'/>")
  },
  {
    id: "nest_concentric_circ_3",
    name: "Concentric Circles (3 Rings)",
    category: "nested",
    tags: ["concentric", "circle", "ring", "target", "triple"],
    svg: wrapSvg("<circle cx='50' cy='50' r='36' fill='none' stroke='%232563eb' stroke-width='2.5'/><circle cx='50' cy='50' r='24' fill='none' stroke='%232563eb' stroke-width='2.5'/><circle cx='50' cy='50' r='12' fill='none' stroke='%232563eb' stroke-width='2.5'/>")
  },
  {
    id: "nest_concentric_sq_2",
    name: "Concentric Squares (2 Boxes)",
    category: "nested",
    tags: ["concentric", "square", "double", "frame"],
    svg: wrapSvg("<rect x='18' y='18' width='64' height='64' fill='none' stroke='%232563eb' stroke-width='3' rx='4'/><rect x='34' y='34' width='32' height='32' fill='none' stroke='%232563eb' stroke-width='3' rx='2'/>")
  },
  {
    id: "nest_diamond_in_sq",
    name: "Diamond inside Square",
    category: "nested",
    tags: ["nested", "diamond", "square", "rhombus"],
    svg: wrapSvg("<rect x='20' y='20' width='60' height='60' fill='none' stroke='%232563eb' stroke-width='3' rx='4'/><polygon points='50,26 74,50 50,74 26,50' fill='%233b82f6' fill-opacity='0.25' stroke='%231d4ed8' stroke-width='3'/>")
  },
  {
    id: "nest_sq_in_diamond",
    name: "Square inside Diamond",
    category: "nested",
    tags: ["nested", "square", "diamond", "rhombus", "inversion"],
    svg: wrapSvg("<polygon points='50,16 84,50 50,84 16,50' fill='none' stroke='%232563eb' stroke-width='3'/><rect x='34' y='34' width='32' height='32' fill='%233b82f6' fill-opacity='0.25' stroke='%231d4ed8' stroke-width='3' rx='2'/>")
  },
  {
    id: "nest_star_in_circ",
    name: "Star inside Circle",
    category: "nested",
    tags: ["nested", "star", "circle"],
    svg: wrapSvg("<circle cx='50' cy='50' r='34' fill='none' stroke='%232563eb' stroke-width='3'/><polygon points='50,22 57,38 74,38 60,49 65,65 50,55 35,65 40,49 26,38 43,38' fill='%233b82f6' fill-opacity='0.25' stroke='%231d4ed8' stroke-width='2'/>")
  },

  // --- GEOMETRIC POLYGONS ---
  {
    id: "poly_triangle_eq",
    name: "Equilateral Triangle (3 Sides)",
    category: "polygons",
    tags: ["triangle", "polygon", "3 sides", "hollow"],
    svg: wrapSvg("<polygon points='50,18 84,78 16,78' fill='none' stroke='%232563eb' stroke-width='3'/>")
  },
  {
    id: "poly_triangle_solid",
    name: "Solid Shaded Triangle (3 Sides)",
    category: "polygons",
    tags: ["triangle", "solid", "shaded", "filled", "3 sides"],
    svg: wrapSvg("<polygon points='50,18 84,78 16,78' fill='%232563eb' stroke='%231d4ed8' stroke-width='3'/>")
  },
  {
    id: "poly_triangle_right",
    name: "Right-Angled Triangle",
    category: "polygons",
    tags: ["triangle", "right-angle", "90deg", "geometry"],
    svg: wrapSvg("<polygon points='22,20 22,80 82,80' fill='none' stroke='%232563eb' stroke-width='3'/>")
  },
  {
    id: "poly_square_hollow",
    name: "Square (4 Sides)",
    category: "polygons",
    tags: ["square", "quadrilateral", "4 sides", "hollow"],
    svg: wrapSvg("<rect x='22' y='22' width='56' height='56' fill='none' stroke='%232563eb' stroke-width='3' rx='4'/>")
  },
  {
    id: "poly_square_solid",
    name: "Solid Shaded Square (4 Sides)",
    category: "polygons",
    tags: ["square", "quadrilateral", "solid", "shaded", "filled", "4 sides"],
    svg: wrapSvg("<rect x='22' y='22' width='56' height='56' fill='%232563eb' stroke='%231d4ed8' stroke-width='3' rx='4'/>")
  },
  {
    id: "poly_rect_hollow",
    name: "Rectangle (4 Sides)",
    category: "polygons",
    tags: ["rectangle", "quadrilateral", "4 sides"],
    svg: wrapSvg("<rect x='16' y='28' width='68' height='44' fill='none' stroke='%232563eb' stroke-width='3' rx='4'/>")
  },
  {
    id: "poly_pentagon",
    name: "Pentagon (5 Sides)",
    category: "polygons",
    tags: ["pentagon", "5 sides", "polygon"],
    svg: wrapSvg("<polygon points='50,16 84,40 71,80 29,80 16,40' fill='none' stroke='%232563eb' stroke-width='3'/>")
  },
  {
    id: "poly_hexagon",
    name: "Hexagon (6 Sides)",
    category: "polygons",
    tags: ["hexagon", "6 sides", "polygon"],
    svg: wrapSvg("<polygon points='50,16 80,33 80,67 50,84 20,67 20,33' fill='none' stroke='%232563eb' stroke-width='3'/>")
  },
  {
    id: "poly_rhombus",
    name: "Rhombus / Diamond (4 Sides)",
    category: "polygons",
    tags: ["rhombus", "diamond", "quadrilateral", "4 sides"],
    svg: wrapSvg("<polygon points='50,16 84,50 50,84 16,50' fill='none' stroke='%232563eb' stroke-width='3'/>")
  },
  {
    id: "poly_trapezoid",
    name: "Trapezoid (4 Sides)",
    category: "polygons",
    tags: ["trapezoid", "quadrilateral", "4 sides"],
    svg: wrapSvg("<polygon points='34,26 66,26 84,74 16,74' fill='none' stroke='%232563eb' stroke-width='3'/>")
  },
  {
    id: "poly_star_5",
    name: "5-Pointed Star (Hollow)",
    category: "polygons",
    tags: ["star", "5 points", "hollow"],
    svg: wrapSvg("<polygon points='50,16 59,38 82,38 64,51 71,73 50,59 29,73 36,51 18,38 41,38' fill='none' stroke='%232563eb' stroke-width='2.5'/>")
  },
  {
    id: "poly_star_solid",
    name: "5-Pointed Star (Solid Shaded)",
    category: "polygons",
    tags: ["star", "5 points", "solid", "shaded", "filled"],
    svg: wrapSvg("<polygon points='50,16 59,38 82,38 64,51 71,73 50,59 29,73 36,51 18,38 41,38' fill='%232563eb' stroke='%231d4ed8' stroke-width='2.5'/>")
  },

  // --- DOTS & TRACKING ---
  {
    id: "dots_1_center",
    name: "1 Dot (Center)",
    category: "dots",
    tags: ["dot", "1 dot", "point", "single"],
    svg: wrapSvg("<circle cx='50' cy='50' r='8' fill='%232563eb'/>")
  },
  {
    id: "dots_2_diag",
    name: "2 Dots (Diagonal)",
    category: "dots",
    tags: ["dots", "2 dots", "diagonal"],
    svg: wrapSvg("<circle cx='32' cy='32' r='7' fill='%232563eb'/><circle cx='68' cy='68' r='7' fill='%232563eb'/>")
  },
  {
    id: "dots_3_diag",
    name: "3 Dots (Diagonal)",
    category: "dots",
    tags: ["dots", "3 dots", "diagonal", "line"],
    svg: wrapSvg("<circle cx='26' cy='26' r='6' fill='%232563eb'/><circle cx='50' cy='50' r='6' fill='%232563eb'/><circle cx='74' cy='74' r='6' fill='%232563eb'/>")
  },
  {
    id: "dots_4_corners",
    name: "4 Dots (Corners)",
    category: "dots",
    tags: ["dots", "4 dots", "corners", "square"],
    svg: wrapSvg("<circle cx='28' cy='28' r='6' fill='%232563eb'/><circle cx='72' cy='28' r='6' fill='%232563eb'/><circle cx='28' cy='72' r='6' fill='%232563eb'/><circle cx='72' cy='72' r='6' fill='%232563eb'/>")
  },
  {
    id: "dots_5_dice",
    name: "5 Dots (Dice Pattern)",
    category: "dots",
    tags: ["dots", "5 dots", "dice", "quincunx"],
    svg: wrapSvg("<circle cx='28' cy='28' r='6' fill='%232563eb'/><circle cx='72' cy='28' r='6' fill='%232563eb'/><circle cx='50' cy='50' r='6' fill='%232563eb'/><circle cx='28' cy='72' r='6' fill='%232563eb'/><circle cx='72' cy='72' r='6' fill='%232563eb'/>")
  },
  {
    id: "sq_dot_tr",
    name: "Square with Top-Right Dot",
    category: "dots",
    tags: ["square", "dot", "corner", "top-right", "tracking"],
    svg: wrapSvg("<rect x='22' y='22' width='56' height='56' fill='none' stroke='%232563eb' stroke-width='3' rx='4'/><circle cx='66' cy='34' r='6' fill='%23ef4444'/>")
  },
  {
    id: "sq_dot_br",
    name: "Square with Bottom-Right Dot",
    category: "dots",
    tags: ["square", "dot", "corner", "bottom-right", "tracking"],
    svg: wrapSvg("<rect x='22' y='22' width='56' height='56' fill='none' stroke='%232563eb' stroke-width='3' rx='4'/><circle cx='66' cy='66' r='6' fill='%23ef4444'/>")
  },
  {
    id: "sq_dot_bl",
    name: "Square with Bottom-Left Dot",
    category: "dots",
    tags: ["square", "dot", "corner", "bottom-left", "tracking"],
    svg: wrapSvg("<rect x='22' y='22' width='56' height='56' fill='none' stroke='%232563eb' stroke-width='3' rx='4'/><circle cx='34' cy='66' r='6' fill='%23ef4444'/>")
  },
  {
    id: "sq_dot_tl",
    name: "Square with Top-Left Dot",
    category: "dots",
    tags: ["square", "dot", "corner", "top-left", "tracking"],
    svg: wrapSvg("<rect x='22' y='22' width='56' height='56' fill='none' stroke='%232563eb' stroke-width='3' rx='4'/><circle cx='34' cy='34' r='6' fill='%23ef4444'/>")
  },
  {
    id: "sq_dot_center",
    name: "Square with Center Dot",
    category: "dots",
    tags: ["square", "dot", "center", "inside"],
    svg: wrapSvg("<rect x='22' y='22' width='56' height='56' fill='none' stroke='%232563eb' stroke-width='3' rx='4'/><circle cx='50' cy='50' r='7' fill='%232563eb'/>")
  },
  {
    id: "circ_dot_center",
    name: "Circle with Center Dot",
    category: "dots",
    tags: ["circle", "dot", "center", "inside"],
    svg: wrapSvg("<circle cx='50' cy='50' r='34' fill='none' stroke='%232563eb' stroke-width='3'/><circle cx='50' cy='50' r='7' fill='%232563eb'/>")
  },
  {
    id: "tri_dot_inside",
    name: "Triangle with Dot Inside",
    category: "dots",
    tags: ["triangle", "dot", "inside", "internal"],
    svg: wrapSvg("<polygon points='50,18 84,78 16,78' fill='none' stroke='%232563eb' stroke-width='3'/><circle cx='50' cy='58' r='6' fill='%232563eb'/>")
  },
  {
    id: "tri_dot_outside",
    name: "Triangle with Dot Outside (Top)",
    category: "dots",
    tags: ["triangle", "dot", "outside", "external", "odd"],
    svg: wrapSvg("<polygon points='50,30 84,84 16,84' fill='none' stroke='%232563eb' stroke-width='3'/><circle cx='50' cy='16' r='6' fill='%23ef4444'/>")
  },

  // --- LINES, CROSSES & CLOCKS ---
  {
    id: "line_1_vert",
    name: "1 Vertical Line",
    category: "lines",
    tags: ["line", "1 line", "vertical", "stroke"],
    svg: wrapSvg("<line x1='50' y1='20' x2='50' y2='80' stroke='%232563eb' stroke-width='5' stroke-linecap='round'/>")
  },
  {
    id: "line_2_vert",
    name: "2 Vertical Lines",
    category: "lines",
    tags: ["lines", "2 lines", "vertical", "parallel"],
    svg: wrapSvg("<line x1='40' y1='20' x2='40' y2='80' stroke='%232563eb' stroke-width='5' stroke-linecap='round'/><line x1='60' y1='20' x2='60' y2='80' stroke='%232563eb' stroke-width='5' stroke-linecap='round'/>")
  },
  {
    id: "line_3_vert",
    name: "3 Vertical Lines",
    category: "lines",
    tags: ["lines", "3 lines", "vertical", "parallel", "progression"],
    svg: wrapSvg("<line x1='30' y1='20' x2='30' y2='80' stroke='%232563eb' stroke-width='5' stroke-linecap='round'/><line x1='50' y1='20' x2='50' y2='80' stroke='%232563eb' stroke-width='5' stroke-linecap='round'/><line x1='70' y1='20' x2='70' y2='80' stroke='%232563eb' stroke-width='5' stroke-linecap='round'/>")
  },
  {
    id: "line_4_vert",
    name: "4 Vertical Lines",
    category: "lines",
    tags: ["lines", "4 lines", "vertical", "parallel", "progression"],
    svg: wrapSvg("<line x1='26' y1='20' x2='26' y2='80' stroke='%232563eb' stroke-width='4' stroke-linecap='round'/><line x1='42' y1='20' x2='42' y2='80' stroke='%232563eb' stroke-width='4' stroke-linecap='round'/><line x1='58' y1='20' x2='58' y2='80' stroke='%232563eb' stroke-width='4' stroke-linecap='round'/><line x1='74' y1='20' x2='74' y2='80' stroke='%232563eb' stroke-width='4' stroke-linecap='round'/>")
  },
  {
    id: "cross_plus",
    name: "Plus Cross (+)",
    category: "lines",
    tags: ["cross", "plus", "intersect", "addition"],
    svg: wrapSvg("<line x1='50' y1='20' x2='50' y2='80' stroke='%232563eb' stroke-width='5' stroke-linecap='round'/><line x1='20' y1='50' x2='80' y2='50' stroke='%232563eb' stroke-width='5' stroke-linecap='round'/>")
  },
  {
    id: "cross_x",
    name: "Diagonal Cross (×)",
    category: "lines",
    tags: ["cross", "diagonal", "x", "multiply"],
    svg: wrapSvg("<line x1='26' y1='26' x2='74' y2='74' stroke='%232563eb' stroke-width='5' stroke-linecap='round'/><line x1='74' y1='26' x2='26' y2='74' stroke='%232563eb' stroke-width='5' stroke-linecap='round'/>")
  },
  {
    id: "clock_12",
    name: "Clock - 12:00",
    category: "lines",
    tags: ["clock", "time", "12", "angles", "dial"],
    svg: wrapSvg("<circle cx='50' cy='50' r='34' fill='none' stroke='%232563eb' stroke-width='3'/><line x1='50' y1='50' x2='50' y2='24' stroke='%232563eb' stroke-width='4' stroke-linecap='round'/><line x1='50' y1='50' x2='50' y2='32' stroke='%23ef4444' stroke-width='3' stroke-linecap='round'/><circle cx='50' cy='50' r='4' fill='%231e293b'/>")
  },
  {
    id: "clock_3",
    name: "Clock - 3:00 (90°)",
    category: "lines",
    tags: ["clock", "time", "3", "90deg", "dial"],
    svg: wrapSvg("<circle cx='50' cy='50' r='34' fill='none' stroke='%232563eb' stroke-width='3'/><line x1='50' y1='50' x2='50' y2='24' stroke='%232563eb' stroke-width='4' stroke-linecap='round'/><line x1='50' y1='50' x2='76' y2='50' stroke='%23ef4444' stroke-width='3' stroke-linecap='round'/><circle cx='50' cy='50' r='4' fill='%231e293b'/>")
  },
  {
    id: "clock_6",
    name: "Clock - 6:00 (180°)",
    category: "lines",
    tags: ["clock", "time", "6", "180deg", "dial"],
    svg: wrapSvg("<circle cx='50' cy='50' r='34' fill='none' stroke='%232563eb' stroke-width='3'/><line x1='50' y1='50' x2='50' y2='24' stroke='%232563eb' stroke-width='4' stroke-linecap='round'/><line x1='50' y1='50' x2='50' y2='76' stroke='%23ef4444' stroke-width='3' stroke-linecap='round'/><circle cx='50' cy='50' r='4' fill='%231e293b'/>")
  },
  {
    id: "clock_9",
    name: "Clock - 9:00 (270°)",
    category: "lines",
    tags: ["clock", "time", "9", "270deg", "dial"],
    svg: wrapSvg("<circle cx='50' cy='50' r='34' fill='none' stroke='%232563eb' stroke-width='3'/><line x1='50' y1='50' x2='50' y2='24' stroke='%232563eb' stroke-width='4' stroke-linecap='round'/><line x1='50' y1='50' x2='24' y2='50' stroke='%23ef4444' stroke-width='3' stroke-linecap='round'/><circle cx='50' cy='50' r='4' fill='%231e293b'/>")
  },

  // --- DIRECTIONAL ARROWS ---
  {
    id: "arrow_0",
    name: "Arrow Up (0°)",
    category: "arrows",
    tags: ["arrow", "up", "north", "0deg", "vertical"],
    svg: wrapSvg("<g transform='rotate(0 50 50)'><path d='M50 20 L50 80 M50 20 L35 35 M50 20 L65 35' stroke='%232563eb' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/></g>")
  },
  {
    id: "arrow_45",
    name: "Arrow Up-Right (45°)",
    category: "arrows",
    tags: ["arrow", "up-right", "north-east", "45deg", "rotation"],
    svg: wrapSvg("<g transform='rotate(45 50 50)'><path d='M50 20 L50 80 M50 20 L35 35 M50 20 L65 35' stroke='%232563eb' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/></g>")
  },
  {
    id: "arrow_90",
    name: "Arrow Right (90°)",
    category: "arrows",
    tags: ["arrow", "right", "east", "90deg", "horizontal"],
    svg: wrapSvg("<g transform='rotate(90 50 50)'><path d='M50 20 L50 80 M50 20 L35 35 M50 20 L65 35' stroke='%232563eb' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/></g>")
  },
  {
    id: "arrow_135",
    name: "Arrow Down-Right (135°)",
    category: "arrows",
    tags: ["arrow", "down-right", "south-east", "135deg", "rotation"],
    svg: wrapSvg("<g transform='rotate(135 50 50)'><path d='M50 20 L50 80 M50 20 L35 35 M50 20 L65 35' stroke='%232563eb' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/></g>")
  },
  {
    id: "arrow_180",
    name: "Arrow Down (180°)",
    category: "arrows",
    tags: ["arrow", "down", "south", "180deg", "vertical"],
    svg: wrapSvg("<g transform='rotate(180 50 50)'><path d='M50 20 L50 80 M50 20 L35 35 M50 20 L65 35' stroke='%232563eb' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/></g>")
  },
  {
    id: "arrow_225",
    name: "Arrow Down-Left (225°)",
    category: "arrows",
    tags: ["arrow", "down-left", "south-west", "225deg", "rotation"],
    svg: wrapSvg("<g transform='rotate(225 50 50)'><path d='M50 20 L50 80 M50 20 L35 35 M50 20 L65 35' stroke='%232563eb' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/></g>")
  },
  {
    id: "arrow_270",
    name: "Arrow Left (270°)",
    category: "arrows",
    tags: ["arrow", "left", "west", "270deg", "horizontal"],
    svg: wrapSvg("<g transform='rotate(270 50 50)'><path d='M50 20 L50 80 M50 20 L35 35 M50 20 L65 35' stroke='%232563eb' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/></g>")
  },
  {
    id: "arrow_315",
    name: "Arrow Up-Left (315°)",
    category: "arrows",
    tags: ["arrow", "up-left", "north-west", "315deg", "rotation"],
    svg: wrapSvg("<g transform='rotate(315 50 50)'><path d='M50 20 L50 80 M50 20 L35 35 M50 20 L65 35' stroke='%232563eb' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/></g>")
  },
  {
    id: "arrow_double_horiz",
    name: "Double-Headed Horizontal Arrow",
    category: "arrows",
    tags: ["arrow", "double", "bidirectional", "horizontal"],
    svg: wrapSvg("<path d='M20 50 L80 50 M32 38 L20 50 L32 62 M68 38 L80 50 L68 62' stroke='%232563eb' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/>")
  },
  {
    id: "arrow_curved_cw",
    name: "Curved Clockwise Arrow",
    category: "arrows",
    tags: ["arrow", "curved", "circle", "clockwise", "turn"],
    svg: wrapSvg("<path d='M 50 20 A 30 30 0 1 1 20 50' fill='none' stroke='%232563eb' stroke-width='5' stroke-linecap='round'/><polygon points='20,38 30,52 12,52' fill='%232563eb'/>")
  }
];

// Helper to look up a shape by id
export const getShapeSvg = (id: string): string => {
  const found = SHAPE_LIBRARY.find((s) => s.id === id);
  return found ? found.svg : "";
};

export type NonVerbalSubType = "series" | "analogy" | "matrix" | "odd_one_out";

export const NON_VERBAL_SUBTYPES: {
  id: NonVerbalSubType;
  label: string;
  labelUrdu: string;
  icon: string;
  desc: string;
}[] = [
  {
    id: "series",
    label: "Pattern Series",
    labelUrdu: "پیٹرن کا تسلسل",
    icon: "➔",
    desc: "Sequential progression of geometric figures with logical transformations"
  },
  {
    id: "analogy",
    label: "Shape Analogy",
    labelUrdu: "اشکال کی تشبیہ",
    icon: "🔄",
    desc: "Fig A is to Fig B as Fig C is to Target (A : B :: C : ?)"
  },
  {
    id: "matrix",
    label: "Matrix Completion",
    labelUrdu: "میٹرکس مکمل کریں",
    icon: "⊞",
    desc: "2x2 or 3x3 pattern grids governed by horizontal & vertical transformation rules"
  },
  {
    id: "odd_one_out",
    label: "Odd One Out",
    labelUrdu: "غیر متعلق شکل کی نشاندہی",
    icon: "★",
    desc: "Five figures sharing a common property, identify the single non-conforming figure"
  }
];

export interface NonVerbalPreset {
  title: string;
  subType: NonVerbalSubType;
  prompt: string;
  problemImages: string[];
  matrixGrid?: "2x2" | "3x3";
  options: { id: string; label: string; image_url: string; text: string }[];
  correct: string;
  explanation: string;
}

export const NON_VERBAL_PRESETS: Record<string, NonVerbalPreset> = {
  series_quadrant: {
    title: "Shaded Quadrant 90° Clockwise Rotation",
    subType: "series",
    prompt: "Look at the pattern sequence below. Which figure should logically replace the question mark (?) in the series? / پیٹرن کے تسلسل کو دیکھ کر درست شکل کا انتخاب کریں:",
    problemImages: [
      getShapeSvg("quad_tr"),
      getShapeSvg("quad_br"),
      getShapeSvg("quad_bl")
    ],
    options: [
      { id: "1", label: "A", image_url: getShapeSvg("quad_tl"), text: "Top-Left Shaded (Next)" },
      { id: "2", label: "B", image_url: getShapeSvg("quad_tr"), text: "Top-Right Shaded" },
      { id: "3", label: "C", image_url: getShapeSvg("quad_br"), text: "Bottom-Right Shaded" },
      { id: "4", label: "D", image_url: getShapeSvg("half_top"), text: "Top-Half Shaded" }
    ],
    correct: "1",
    explanation: "The shaded quadrant moves 90° clockwise in each consecutive figure: Top-Right (Figure 1) ➔ Bottom-Right (Figure 2) ➔ Bottom-Left (Figure 3). The next logical figure must have the Top-Left quadrant shaded (Option A)."
  },
  series_arrow: {
    title: "Arrow 45° Clockwise Rotation",
    subType: "series",
    prompt: "Which figure logically completes the arrow rotation series? / تیر کے گھماؤ کے تسلسل کو مکمل کرنے والی شکل منتخب کریں:",
    problemImages: [
      getShapeSvg("arrow_0"),
      getShapeSvg("arrow_45"),
      getShapeSvg("arrow_90")
    ],
    options: [
      { id: "1", label: "A", image_url: getShapeSvg("arrow_135"), text: "135° Down-Right (Next)" },
      { id: "2", label: "B", image_url: getShapeSvg("arrow_180"), text: "180° Downwards" },
      { id: "3", label: "C", image_url: getShapeSvg("arrow_270"), text: "270° Leftwards" },
      { id: "4", label: "D", image_url: getShapeSvg("arrow_315"), text: "315° Up-Left" }
    ],
    correct: "1",
    explanation: "Each arrow rotates 45° clockwise: 0° Up (Figure 1) ➔ 45° Up-Right (Figure 2) ➔ 90° Right (Figure 3). The next figure must be rotated 135° Down-Right (Option A)."
  },
  series_dots: {
    title: "Increasing Dot Count (1 ➔ 2 ➔ 3 ➔ ?)",
    subType: "series",
    prompt: "Count the dots in sequence. Which figure continues the progression? / نقطوں کی تعداد کے تسلسل کو دیکھ کر درست آپشن چنیں:",
    problemImages: [
      getShapeSvg("dots_1_center"),
      getShapeSvg("dots_2_diag"),
      getShapeSvg("dots_3_diag")
    ],
    options: [
      { id: "1", label: "A", image_url: getShapeSvg("dots_4_corners"), text: "4 Dots (Next)" },
      { id: "2", label: "B", image_url: getShapeSvg("dots_5_dice"), text: "5 Dots" },
      { id: "3", label: "C", image_url: getShapeSvg("dots_2_diag"), text: "2 Dots" },
      { id: "4", label: "D", image_url: getShapeSvg("dots_1_center"), text: "1 Dot" }
    ],
    correct: "1",
    explanation: "The number of dots increments by +1 in each step: 1 dot ➔ 2 dots ➔ 3 dots. The next shape must have 4 dots (Option A)."
  },
  analogy_nested: {
    title: "Outer & Inner Shape Inversion Analogy",
    subType: "analogy",
    prompt: "Figure A is to Figure B as Figure C is to (?): / شکل A کا تعلق B سے ہے وہی تعلق C کا کس شکل سے ہوگا؟",
    problemImages: [
      getShapeSvg("nest_circ_in_sq"),
      getShapeSvg("nest_sq_in_circ"),
      getShapeSvg("nest_tri_in_sq")
    ],
    options: [
      { id: "1", label: "A", image_url: getShapeSvg("nest_sq_in_tri"), text: "Square inside Triangle (Inverted)" },
      { id: "2", label: "B", image_url: getShapeSvg("nest_circ_in_tri"), text: "Circle inside Triangle" },
      { id: "3", label: "C", image_url: getShapeSvg("nest_tri_in_circ"), text: "Triangle inside Circle" },
      { id: "4", label: "D", image_url: getShapeSvg("nest_concentric_sq_2"), text: "Concentric Squares" }
    ],
    correct: "1",
    explanation: "In Pair 1 (A : B), the inner shape and outer enclosing shape invert: Circle in Square becomes Square in Circle. Applying the exact same rule to Figure C (Triangle in Square), the target figure must be a Square inside a Triangle (Option A)."
  },
  analogy_shading: {
    title: "Hollow-to-Solid Shading Analogy",
    subType: "analogy",
    prompt: "Identify the relationship between the first pair and apply it to the second pair: / پہلی جوڑی کے باہمی تعلق کو سمجھتے ہوئے دوسری جوڑی مکمل کریں:",
    problemImages: [
      getShapeSvg("poly_triangle_eq"),
      getShapeSvg("poly_triangle_solid"),
      getShapeSvg("poly_star_5")
    ],
    options: [
      { id: "1", label: "A", image_url: getShapeSvg("poly_star_solid"), text: "Solid Shaded Star (Target)" },
      { id: "2", label: "B", image_url: getShapeSvg("poly_square_solid"), text: "Solid Square" },
      { id: "3", label: "C", image_url: getShapeSvg("poly_triangle_solid"), text: "Solid Triangle" },
      { id: "4", label: "D", image_url: getShapeSvg("poly_star_5"), text: "Hollow Star" }
    ],
    correct: "1",
    explanation: "Figure A (Hollow Triangle) is transformed into Figure B (Solid Shaded Triangle) by filling its area. Figure C is a Hollow Star, so Figure D must be a Solid Shaded Star (Option A)."
  },
  matrix_2x2_dot: {
    title: "2×2 Pattern Matrix: Shape & Dot Progression",
    subType: "matrix",
    matrixGrid: "2x2",
    prompt: "Examine the rules across rows and columns to find the missing matrix cell (?): / میٹرکس کی قطاروں اور کالموں کا اصول سمجھ کر نامعلوم شکل چنیں:",
    problemImages: [
      getShapeSvg("poly_triangle_eq"), // R1, C1
      getShapeSvg("tri_dot_inside"),    // R1, C2
      getShapeSvg("poly_square_hollow") // R2, C1
      // R2, C2 is ?
    ],
    options: [
      { id: "1", label: "A", image_url: getShapeSvg("sq_dot_center"), text: "Square with Center Dot (Correct)" },
      { id: "2", label: "B", image_url: getShapeSvg("poly_square_hollow"), text: "Hollow Square" },
      { id: "3", label: "C", image_url: getShapeSvg("tri_dot_inside"), text: "Triangle with Dot" },
      { id: "4", label: "D", image_url: getShapeSvg("sq_dot_tr"), text: "Square with Corner Dot" }
    ],
    correct: "1",
    explanation: "Across Row 1, a center dot is added inside the geometric figure (Triangle ➔ Triangle with Dot). Across Row 2, applying the identical rule to the Hollow Square results in a Square with a Center Dot (Option A)."
  },
  matrix_3x3_lines: {
    title: "3×3 Pattern Matrix: Progressive Counts & Rotation",
    subType: "matrix",
    matrixGrid: "3x3",
    prompt: "Identify the pattern across rows and columns to determine the bottom-right matrix item: / 3x3 میٹرکس کا منطقی ربط دیکھ کر آخری خانے کی درست شکل تلاش کریں:",
    problemImages: [
      getShapeSvg("line_1_vert"), // R1, C1
      getShapeSvg("line_2_vert"), // R1, C2
      getShapeSvg("line_3_vert"), // R1, C3
      getShapeSvg("clock_12"),    // R2, C1
      getShapeSvg("clock_3"),     // R2, C2
      getShapeSvg("clock_6"),     // R2, C3
      getShapeSvg("dots_1_center"),// R3, C1
      getShapeSvg("dots_2_diag")  // R3, C2
      // R3, C3 is ?
    ],
    options: [
      { id: "1", label: "A", image_url: getShapeSvg("dots_3_diag"), text: "3 Diagonal Dots (Row 3 Step 3)" },
      { id: "2", label: "B", image_url: getShapeSvg("dots_4_corners"), text: "4 Corner Dots" },
      { id: "3", label: "C", image_url: getShapeSvg("dots_1_center"), text: "1 Center Dot" },
      { id: "4", label: "D", image_url: getShapeSvg("line_3_vert"), text: "3 Vertical Lines" }
    ],
    correct: "1",
    explanation: "In Row 1, vertical lines increment: 1, 2, 3. In Row 2, clock hands advance by 90°: 12:00, 3:00, 6:00. In Row 3, dot count increments: 1 dot, 2 dots, so the missing cell must have 3 diagonal dots (Option A)."
  },
  odd_one_out_quads: {
    title: "Odd One Out: 4 Quadrilaterals vs 1 Triangle",
    subType: "odd_one_out",
    prompt: "Four of the five figures share a common geometric property. Select the ONE figure that is the Odd One Out: / ان پانچ اشکال میں سے چار میں ایک جیسی خصوصیت ہے۔ مختلف شکل کی نشاندہی کریں:",
    problemImages: [],
    options: [
      { id: "1", label: "A", image_url: getShapeSvg("poly_square_hollow"), text: "Square (4 sides)" },
      { id: "2", label: "B", image_url: getShapeSvg("poly_rect_hollow"), text: "Rectangle (4 sides)" },
      { id: "3", label: "C", image_url: getShapeSvg("poly_rhombus"), text: "Rhombus (4 sides)" },
      { id: "4", label: "D", image_url: getShapeSvg("poly_triangle_eq"), text: "Triangle (3 sides - ODD ONE OUT)" },
      { id: "5", label: "E", image_url: getShapeSvg("poly_trapezoid"), text: "Trapezoid (4 sides)" }
    ],
    correct: "4",
    explanation: "Figures A, B, C, and E are all 4-sided quadrilaterals (polygons with 4 edges and 4 vertices). Figure D is an equilateral triangle with only 3 sides, making it the odd one out."
  },
  odd_one_out_dots: {
    title: "Odd One Out: 4 Shapes with Dot Inside vs 1 Dot Outside",
    subType: "odd_one_out",
    prompt: "Inspect the position of the dot relative to the shape. Which figure does NOT follow the group rule? / نقطے کی پوزیشن کا معائنہ کر کے مختلف شکل منتخب کریں:",
    problemImages: [],
    options: [
      { id: "1", label: "A", image_url: getShapeSvg("sq_dot_center"), text: "Dot Inside Square" },
      { id: "2", label: "B", image_url: getShapeSvg("circ_dot_center"), text: "Dot Inside Circle" },
      { id: "3", label: "C", image_url: getShapeSvg("tri_dot_inside"), text: "Dot Inside Triangle" },
      { id: "4", label: "D", image_url: getShapeSvg("tri_dot_outside"), text: "Dot OUTSIDE Triangle - ODD ONE OUT" },
      { id: "5", label: "E", image_url: getShapeSvg("nest_circ_in_sq"), text: "Circle Inside Square" }
    ],
    correct: "4",
    explanation: "Figures A, B, C, and E all have the secondary mark or shape positioned strictly inside the outer boundary. In Figure D, the red dot is placed completely outside above the triangle, making it the odd one out."
  }
};

