"""
===============================================================================
M3 LINEAR ALGEBRA — NOTEBOOK 1 VISUALIZATION ENGINE (m3_engine.py)
Newton School of Technology | Mathematics-3 (Algebra + Geometry + Computation)
===============================================================================
This module encapsulates all complex Matplotlib, Plotly, and ipywidgets 
machinery behind clean 1-line student-facing function calls.
"""

import sys
import numpy as np
import sympy as sp
import matplotlib.pyplot as plt
import plotly.graph_objects as go
import ipywidgets as widgets
from IPython.display import display, HTML, clear_output

def setup_environment(verbose=False):
    """
    Silently configures Colab/Jupyter dependencies and displays a styled banner.
    """
    try:
        if 'google.colab' in sys.modules:
            from google.colab import output
            output.enable_custom_widget_manager()
    except Exception:
        pass

    plt.rcParams['figure.dpi'] = 110
    plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
    plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')

    banner_html = """<div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); border: 1px solid #4338ca; border-radius: 12px; padding: 18px 24px; color: #f8fafc; font-family: sans-serif; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3); max-width: 800px; margin: 10px 0;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
                <h3 style="margin: 0; color: #818cf8; font-size: 18px; font-weight: 800;">🎉 M3 Interactive Laboratory Ready!</h3>
                <p style="margin: 4px 0 0 0; color: #c7d2fe; font-size: 13px;">Engine loaded successfully. All 2D/3D graphics, matrix solvers, and interactive widgets initialized.</p>
            </div>
            <span style="background-color: #312e81; color: #a5b4fc; border: 1px solid #6366f1; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; font-family: monospace;">
                M3-NOTEBOOK-1
            </span>
        </div>
    </div>"""
    clear_output(wait=True)
    display(HTML(banner_html))

def render_2d_system_experiment(preset="1. Unique Solution (Intersecting Lines)", k_scale=1.0):
    """
    Engine for 2D system visualization with controlled preset experiments.
    """
    fig, ax = plt.subplots(figsize=(7.5, 5.2))
    ax.set_facecolor('#0f172a')
    fig.patch.set_facecolor('#0f172a')
    ax.grid(True, color='#334155', linestyle='--', linewidth=0.8)
    ax.axhline(0, color='#64748b', lw=1)
    ax.axvline(0, color='#64748b', lw=1)

    x_vals = np.linspace(-3, 7, 300)

    if "1. Unique Solution" in preset:
        a11, a12, b1 = 1.0, -2.0, 1.0
        a21, a22, b2 = 3.0, 2.0, 11.0
        y1 = (b1 - a11 * x_vals) / a12
        y2 = (b2 - a21 * x_vals) / a22
        
        ax.plot(x_vals, y1, color='#3b82f6', lw=3, label=f'Line 1: {a11:g}x + ({a12:g})y = {b1:g}')
        ax.plot(x_vals, y2, color='#a855f7', lw=3, label=f'Line 2: {a21:g}x + ({a22:g})y = {b2:g}')
        ax.scatter([3], [1], color='#10b981', s=160, zorder=5, edgecolors='white', linewidths=2)
        ax.annotate("Unique Solution (3, 1)", xy=(3, 1), xytext=(3.3, 1.5),
                    color='#10b981', fontweight='bold', fontsize=11,
                    arrowprops=dict(arrowstyle="->", color='#10b981', lw=2))
        status_txt = "✅ Intersecting Lines: Exactly 1 Unique Solution Point."
        status_col = "#10b981"

    elif "2. No Solution" in preset:
        a11, a12, b1 = 1.0, -2.0, 1.0
        a21, a22, b2 = 1.0, -2.0, 5.0
        y1 = (b1 - a11 * x_vals) / a12
        y2 = (b2 - a21 * x_vals) / a22
        
        ax.plot(x_vals, y1, color='#3b82f6', lw=3, label=f'Line 1: {a11:g}x + ({a12:g})y = {b1:g}')
        ax.plot(x_vals, y2, color='#f43f5e', lw=3, label=f'Line 2: {a21:g}x + ({a22:g})y = {b2:g}')
        status_txt = "❌ Parallel Lines: Trajectories never intersect (Inconsistent System)."
        status_col = "#f43f5e"

    else:
        a11, a12, b1 = 1.0, -2.0, 1.0
        a21, a22, b2 = k_scale * a11, k_scale * a12, k_scale * b1
        y1 = (b1 - a11 * x_vals) / a12
        y2 = (b2 - a21 * x_vals) / a22
        
        ax.plot(x_vals, y1, color='#3b82f6', lw=5, label=f'Line 1: {a11:g}x + ({a12:g})y = {b1:g}')
        ax.plot(x_vals, y2, color='#38bdf8', lw=2, linestyle='--', label=f'Line 2: {a21:g}x + ({a22:g})y = {b2:g} (Scaled by k={k_scale:g})')
        status_txt = f"♾️ Coincident Lines: Line 2 lies on Line 1 (Infinitely Many Solutions)."
        status_col = "#38bdf8"

    ax.set_xlim(-2, 6)
    ax.set_ylim(-3, 5)
    ax.set_xlabel("X Variable", color="#94a3b8", fontweight="bold")
    ax.set_ylabel("Y Variable", color="#94a3b8", fontweight="bold")
    ax.set_title(f"2D System Geometry\n{status_txt}", color=status_col, fontsize=11, fontweight="bold", pad=12)
    ax.legend(loc="upper left", facecolor="#1e293b", edgecolor="#475569", labelcolor="white", fontsize=9)
    plt.tight_layout()
    plt.show()

def render_3d_planes_experiment(preset="1. Unique Point Intersection"):
    """
    Mouse-rotatable Plotly 3D Surface Visualizer for 3D Linear Systems.
    """
    fig = go.Figure()
    u_vals = np.linspace(-3, 3, 15)
    v_vals = np.linspace(-3, 3, 15)
    U, V = np.meshgrid(u_vals, v_vals)

    if "1. Unique Point" in preset:
        Z1 = 3 - U - V
        Z2 = 1 - U + V
        Z3 = U + V - 1
        fig.add_trace(go.Surface(x=U, y=V, z=Z1, name="Plane 1", showscale=False, colorscale=[[0, 'rgba(59,130,246,0.5)'], [1, 'rgba(59,130,246,0.5)']]))
        fig.add_trace(go.Surface(x=U, y=V, z=Z2, name="Plane 2", showscale=False, colorscale=[[0, 'rgba(168,85,247,0.5)'], [1, 'rgba(168,85,247,0.5)']]))
        fig.add_trace(go.Surface(x=U, y=V, z=Z3, name="Plane 3", showscale=False, colorscale=[[0, 'rgba(16,185,129,0.5)'], [1, 'rgba(16,185,129,0.5)']]))
        fig.add_trace(go.Scatter3d(x=[1], y=[1], z=[1], mode='markers+text', marker=dict(size=10, color='#10b981'), text=['Unique Solution (1,1,1)'], textposition='top center'))
        title_txt = "3D System: Exactly 1 Unique Point Intersection (Consistent)"

    elif "2. Inconsistent System" in preset:
        Z1, Z2, Z3 = U, V, U + V + 2
        fig.add_trace(go.Surface(x=U, y=V, z=Z1, name="Plane 1", showscale=False, colorscale=[[0, 'rgba(239,68,68,0.5)'], [1, 'rgba(239,68,68,0.5)']]))
        fig.add_trace(go.Surface(x=U, y=V, z=Z2, name="Plane 2", showscale=False, colorscale=[[0, 'rgba(245,158,11,0.5)'], [1, 'rgba(245,158,11,0.5)']]))
        fig.add_trace(go.Surface(x=U, y=V, z=Z3, name="Plane 3", showscale=False, colorscale=[[0, 'rgba(236,72,153,0.5)'], [1, 'rgba(236,72,153,0.5)']]))
        title_txt = "3D System: Inconsistent System (No Common Intersection Point across all 3 planes)"

    else:
        Z1 = Z2 = Z3 = 2 - U
        fig.add_trace(go.Surface(x=U, y=V, z=Z1, name="Common Line Planes", showscale=False, colorscale=[[0, 'rgba(56,189,248,0.5)'], [1, 'rgba(56,189,248,0.5)']]))
        title_txt = "3D System: Infinitely Many Solutions (Planes Intersect Along a Line)"

    fig.update_layout(
        title=dict(text=title_txt, font=dict(color="white", size=13)),
        scene=dict(
            xaxis=dict(title="X", backgroundcolor="#0f172a", gridcolor="#334155"),
            yaxis=dict(title="Y", backgroundcolor="#0f172a", gridcolor="#334155"),
            zaxis=dict(title="Z", backgroundcolor="#0f172a", gridcolor="#334155"),
            camera=dict(eye=dict(x=1.5, y=-1.5, z=1.2)), aspectmode='cube'
        ),
        paper_bgcolor="#0f172a", margin=dict(l=0, r=0, b=0, t=40)
    )
    fig.show()

def render_dual_lenses_of_ax_b(x1=2.0, x2=1.0):
    """
    Exhibits Ax = b from Row Picture vs Column Picture side-by-side.
    """
    fig, (ax_row, ax_col) = plt.subplots(1, 2, figsize=(11.5, 4.8))
    fig.patch.set_facecolor('#0f172a')
    
    for ax in (ax_row, ax_col):
        ax.set_facecolor('#1e293b')
        ax.grid(True, color='#334155', linestyle='--', linewidth=0.8)
        ax.axhline(0, color='#64748b', lw=1)
        ax.axvline(0, color='#64748b', lw=1)

    a1, a2, b_target = np.array([2.0, 1.0]), np.array([-1.0, 2.0]), np.array([3.0, 4.0])

    # Row Picture
    x_range = np.linspace(-1, 4, 200)
    ax_row.plot(x_range, 2*x_range - 3, color='#3b82f6', lw=3, label='Row 1: 2x₁ - x₂ = 3')
    ax_row.plot(x_range, -0.5*x_range + 2, color='#a855f7', lw=3, label='Row 2: x₁ + 2x₂ = 4')
    ax_row.scatter([2], [1], color='#10b981', s=150, zorder=5, edgecolors='white', linewidths=2)
    ax_row.set_xlim(-1, 4)
    ax_row.set_ylim(-2, 4)
    ax_row.set_title("LENS 1: Row Picture (Intersection of Lines)", color="#38bdf8", fontsize=11, fontweight="bold")
    ax_row.legend(loc="upper left", facecolor="#0f172a", edgecolor="#334155", labelcolor="white", fontsize=8.5)

    # Column Picture
    v1_step, v2_step = x1 * a1, x2 * a2
    b_result = v1_step + v2_step
    ax_col.quiver(0, 0, v1_step[0], v1_step[1], angles='xy', scale_units='xy', scale=1, color='#f59e0b', lw=3.5, label=f'x₁·a1 ({x1:g}·a1)')
    ax_col.quiver(v1_step[0], v1_step[1], v2_step[0], v2_step[1], angles='xy', scale_units='xy', scale=1, color='#a855f7', lw=3.5, label=f'x₂·a2 ({x2:g}·a2)')
    ax_col.scatter([b_target[0]], [b_target[1]], color='#10b981', s=180, marker='*', zorder=6, label='Target b = [3, 4]ᵀ')

    dist = np.linalg.norm(b_result - b_target)
    status_msg = "🎯 Target b Reached!" if dist < 1e-3 else f"Distance to b: {dist:.2f}"
    ax_col.set_xlim(-2, 6)
    ax_col.set_ylim(-1, 6)
    ax_col.set_title(f"LENS 2: Column Picture (Linear Combination)\n{status_msg}", color="#10b981" if dist < 1e-3 else "#f59e0b", fontsize=11, fontweight="bold")
    ax_col.legend(loc="upper left", facecolor="#0f172a", edgecolor="#334155", labelcolor="white", fontsize=8.5)

    plt.tight_layout()
    plt.show()

def launch_target_reacher_game():
    """
    Target Vector Reacher Game: Interactive reachability before formal abstraction.
    """
    v1, v2, target_b = np.array([2.0, 1.0]), np.array([-1.0, 3.0]), np.array([3.0, 5.0])
    c1_slider = widgets.FloatSlider(value=0.0, min=-3.0, max=4.0, step=0.25, description="c1 (v1):", continuous_update=False)
    c2_slider = widgets.FloatSlider(value=0.0, min=-3.0, max=4.0, step=0.25, description="c2 (v2):", continuous_update=False)

    def draw_arena(c1, c2):
        fig, ax = plt.subplots(figsize=(7, 5.2))
        ax.set_facecolor('#0f172a')
        fig.patch.set_facecolor('#0f172a')
        ax.grid(True, color='#334155', linestyle='--', linewidth=0.8)
        ax.axhline(0, color='#64748b', lw=1)
        ax.axvline(0, color='#64748b', lw=1)

        v1_s, v2_s = c1 * v1, c2 * v2
        curr_pos = v1_s + v2_s
        dist = np.linalg.norm(curr_pos - target_b)

        ax.quiver(0, 0, v1_s[0], v1_s[1], angles='xy', scale_units='xy', scale=1, color='#ef4444', lw=4, label=f'c1·v1 ({c1:g})')
        ax.quiver(v1_s[0], v1_s[1], v2_s[0], v2_s[1], angles='xy', scale_units='xy', scale=1, color='#3b82f6', lw=4, label=f'c2·v2 ({c2:g})')
        ax.scatter([target_b[0]], [target_b[1]], color='#f59e0b', s=220, marker='*', zorder=6, label='Target Star b [3, 5]ᵀ')
        ax.scatter([curr_pos[0]], [curr_pos[1]], color='#10b981' if dist < 0.2 else '#ec4899', s=110, zorder=7)

        status_txt = "🎯 TARGET UNLOCKED! You represented target b as a Linear Combination!" if dist < 0.2 else f"Distance to Target Star: {dist:.2f} units"
        ax.set_xlim(-5, 8)
        ax.set_ylim(-3, 8)
        ax.set_title(f"Target Vector Reacher Arena\n{status_txt}", color="#10b981" if dist < 0.2 else "#38bdf8", fontsize=10, fontweight="bold", pad=12)
        ax.legend(loc="upper left", facecolor="#1e293b", edgecolor="#475569", labelcolor="white", fontsize=8)
        plt.tight_layout()
        plt.show()

    ui = widgets.VBox([
        widgets.HBox([c1_slider, c2_slider]),
        widgets.interactive_output(draw_arena, {'c1': c1_slider, 'c2': c2_slider})
    ], layout=widgets.Layout(align_items='center'))

    display(ui)
