void main(){
    vec3 col = vec3(0.0);

    vec2 offset = vec2(-1.78, 0);
    
    vec2 c = (r/(time*10.0) + offset);
    
    //z = z^2 + c
    
    vec2 z = vec2(0);
    float n = 0.;
    for(int i = 0; i < 400; i++){
        float a = z.x;
        float b = z.y;
        z.x = a*a - b*b + c.x;
        z.y = 2.0*a*b + c.y;
        
        if(length(z) > 2.0){
            col.r =(1./ length(z) + n*0.1)*0.3;
            col.g = n*0.03*length(z)*0.1;
            col.b = n*n*0.05;
            break;
        }
        
        n += 1.0;
    }
       
    gl_FragColor = vec4(col, 1.0);
}