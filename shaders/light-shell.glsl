#define time time * 1.0

void main(){
    vec3 col = vec3(0);
    vec2 r = r;

    float a = angle(r);
    vec2 rd = normalize(r);
    r += rd * a * 0.35 +
    0.4*rd * sin(a * 50. + time*.005*sin(time*2.0)) * 0.008 +
    0.4*rd * sin(a * 100. + time*.005*sin(time*1.5)) * 0.008 +
    0.4*rd * sin(a * 110. + time*.005*sin(time*0.8)) * 0.003 + 
    0.4*rd * sin(a * 150. + time*.005*sin(time*1.3)) * 0.004 + 
    0.4*rd * sin(a * 280. + time*.005*sin(time*1.1)) * 0.001;
    
    float len = length(r);
    
    if(length(r) < .5){
        col = vec3(uv + vec2(sin(time + a), cos(time + a + 2.3))*.25, sin(time + a*a)*.5 + .5) * pow((.5 - length(r))*2., 1./6.);
    }
    
	gl_FragColor = vec4(col, 1.0);
}