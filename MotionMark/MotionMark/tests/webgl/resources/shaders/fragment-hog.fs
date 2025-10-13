precision highp float;
varying vec2 v_uv;
uniform float u_time;
uniform int u_iterations;
uniform vec2 u_resolution;

vec3 calc_color(float t) {
    // Define a multi-color palette
    vec3 palette1 = vec3(0.0, 0.0, 0.3); // Dark Blue
    vec3 palette2 = vec3(1.0, 1.0, 1.0); // White
    vec3 palette3 = vec3(1.0, 0.8, 0.0); // Yellow
    vec3 palette4 = vec3(1.0, 0.2, 0.0); // Orange/Red

    // Gamma correct the linear interpolation factor
    t = pow(t, 2.2);

    if (t < 0.33) {
        return mix(palette1, palette2, t / 0.33);
    } else if (t < 0.66) {
        return mix(palette2, palette3, (t - 0.33) / 0.33);
    } else {
        return mix(palette3, palette4, (t - 0.66) / 0.34);
    }
}

// This shader is designed to have a uniform workload.
void main() {
    // Correct for aspect ratio to prevent stretching.
    vec2 uv = v_uv - 0.5;
    uv.x *= u_resolution.x / u_resolution.y;

    float zoom_size = 3.0 * pow(0.87, u_time);
    vec2 zoom_center = vec2(-0.75, 0.1);

    // Map the UV coordinates to the zoomed region of the complex plane.
    vec2 c = (uv * zoom_size) + zoom_center;
    vec2 z = vec2(0.0, 0.0);

    float escape_time = -1.0; // Use -1 to signify it has not escaped yet.
    vec2 escape_z = vec2(0.0);

    // This loop ALWAYS runs for the full u_iterations to ensure a uniform workload.
    // The hardcoded 50000 is a safety/compatibility limit. The real limit is u_iterations.
    float accumulator = 0.0;
    for(int i = 0; i < 50000; i++) {
        if (i >= u_iterations) {
            break;
        }

        // z = z^2 + c (pure Mandelbrot calculation for a clean visual)
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;

        // Record the escape time and z value ONCE, but do not break the loop.
        if (length(z) > 2.0 && escape_time < 0.0) {
            escape_time = float(i);
            escape_z = z;
        }

        accumulator += 1.0 / pow(2.0, float(i));
    }

    vec3 color;
    if (escape_time < 0.0) {
        // Point is inside the set. Use black for a stable, high-contrast interior.
        color = vec3(0.0, 0.0, 0.0);
    } else {
        // const float MAX_COLOR_ITERATIONS = 200.0;
        float color_steps = float(u_iterations);
        float t1 = min(escape_time, color_steps) / color_steps;
        float t2 = min(escape_time + 1.0, color_steps) / color_steps;

        // Blend between the colors based on iteration count and the escape value of z.
        vec3 color1 = calc_color(t1);
        vec3 color2 = calc_color(t2);

        float log_z = log(dot(escape_z, escape_z)) / 2.0;
        float t = 1.0 - log(log_z / log(2.0)) / log(2.0);

        color = mix(color1, color2, t);
    }

    color *= accumulator;
    color /= 2.0 - 1.0 / pow(2.0, float(u_iterations - 1));

    gl_FragColor = vec4(color, 1.0);
}
