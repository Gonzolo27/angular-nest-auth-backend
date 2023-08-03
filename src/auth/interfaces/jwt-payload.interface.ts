export interface JwtPayload {
    id: string,
    iat?: number, //Fecha creación
    exp?: number  //Fecha expiración
}