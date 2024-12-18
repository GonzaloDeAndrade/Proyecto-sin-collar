import { Inject, inject, Injectable } from '@angular/core';
import { cargaUsuario } from '../../shared/mascota/Interface/cargaUsuario.interface';
import { HttpClient } from '@angular/common/http';
import { Observable,tap,of,catchError } from 'rxjs';
import { map } from 'rxjs';
import { EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import Swal from 'sweetalert2';
@Injectable({
  providedIn: 'root'
})
export class UsuarioServicioService {
  private rol: string | null = null;
  private userKey = "user";
  private autenticado = new BehaviorSubject<boolean>(false);
    http= inject(HttpClient);
    url = 'http://localhost:3000/usuarios';
    private usuario: cargaUsuario | undefined = undefined;
    usuarioActualizado = new EventEmitter<void>(); 
  
    router= inject(Router);
    get currentUser(): cargaUsuario | undefined {
      if (!this.usuario) return undefined
      //structuredClone(this.user)
      return { ...this.usuario };
    }
  
   
    verificarUserAndPass(email: string, contraseña: string) {
  
      this.getUsuario().subscribe(users => {
        const usuarioEncontrado= 
        users.find(u => 
          u.contraseña === contraseña && u.email === email); 
          if (usuarioEncontrado){
            this.usuario = usuarioEncontrado;
            console.log("Exitoso");
            localStorage.setItem('emailusuario',usuarioEncontrado.email!.toString());
            localStorage.setItem('token', usuarioEncontrado.id!.toString());
            localStorage.setItem('rol', usuarioEncontrado.rol!.toString());
            Swal.fire({
              title: "Bienvenido "+usuarioEncontrado.nombre,
              text: "Usted ha iniciado sesión correctamente",
              icon: "success"
            });
            this.router.navigate(['/home'])
          }
          else
          {console.log("ASD");
            Swal.fire({
              icon: 'error',
              title: 'Email o contraseña incorrecta',
              text: 'Por favor ingrese un usuario válido',
            });
          }
        });
      };
  
    checkStatusAutenticacion(): Observable<boolean> {
      const token = localStorage.getItem('token')
      console.log("TOKEN"+token);
      if (!token) {
        
        this.autenticado.next(false);
        return of(false)
      }
      
      return this.http.get<cargaUsuario>(`${this.url}/${token}`)
        .pipe(
          tap(u => {this.usuario = u,  this.autenticado.next(true); }),
          map(u => !!u),
          catchError(err => of(false))
        )
    }
    getAuthStatus(): Observable<boolean> {
      return this.autenticado.asObservable();
    }
    logout() {
      this.usuario = undefined;
      localStorage.clear()
    }
    setUsuario(usuario: cargaUsuario): Observable<cargaUsuario> {
      this.usuario = usuario;
      return this.http.post<cargaUsuario>(this.url, usuario);
      this.usuarioActualizado.emit();
    }
    getUsuario(): Observable<cargaUsuario[]> {
      return this.http.get<cargaUsuario[]>(`${this.url}`);
    }
    getUserID(): string|undefined
    {
      return this.usuario?.id;
    }

    getUsuarioByIdUser(id:string|undefined|null):Observable<cargaUsuario>
  {
  return this.http.get<cargaUsuario>(`${this.url}/${id}`);
  }
     // Obtiene el nombre completo del usuario conectado
     getNombreCompleto(): string {
      return this.usuario ? `${this.usuario.nombre} ${this.usuario.apellido}` : '';
    }
    setRol(rol: string) {
      this.rol = rol;
      localStorage.setItem('rol', rol);
    }

    getRol(): string | null {
      const newrol=localStorage.getItem('rol');

      return newrol;
    }
  verificarUsuarioExistente(email: string): Observable<boolean> {
    return this.http.get<cargaUsuario[]>(`${this.url}?email=${email}`).pipe(
      map((usuarios: cargaUsuario[])=> usuarios.length > 0) // Devuelve true si hay un usuario con ese email
    );
  }
  saveUser(user: cargaUsuario): void {
    localStorage.setItem(this.userKey, JSON.stringify(user)); // Guarda el usuario en localStorage
  }
  getUserLocal(): cargaUsuario {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  updateUserAdmin(id:string|undefined,user:cargaUsuario): Observable<cargaUsuario>{
    return this.http.put<cargaUsuario>(`${this.url}/${id}`,user);
  }
  deleteUserById(id:string|undefined):Observable<void>
  {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
