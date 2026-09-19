# barnsley-fern

Interactive Barnsley fern sketch built with p5.js.

## Controls

- Zoom: changes camera magnification with an exponential scale, so you can keep zooming much deeper than the base fit size.
- Size: changes the base fitted size of the fern before zoom is applied.
- Speed: controls how many points are plotted per frame.
- Detail: changes point thickness. Higher values draw finer points.
- Offset X / Offset Y: moves the fern around the canvas.
- Randomize View: picks a new visible composition without sending the fern far off screen.

## Shortcuts

- Drag with left mouse button: pan around the current zoomed view.
- Scroll: zoom in and out toward the cursor position.
- Hold `W` and scroll: adjust speed.
- Hold `Q` and scroll: adjust base size.
- Hold `E` and scroll: adjust detail.
- Hold `R` and scroll: adjust horizontal offset.
- Hold `T` and scroll: adjust vertical offset.
- Press `Alt`: toggle fast adjustments.
- Press `Space`: resize the canvas to the current window and redraw.

## Notes

- The sketch keeps drawing continuously, so high speed values increase CPU usage.
- The current speed limit is intentionally capped to keep the page responsive.
- Deep zoom automatically increases the sampling budget so the visible region fills in faster.
