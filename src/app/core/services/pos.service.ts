import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Sabor } from '../models/sabor.model';
import { Presentacion } from '../models/presentacion.model';
import { Topping } from '../models/topping.model';
import { ProductoSimple } from '../models/producto-simple.model';
import { CrearPedidoRequest, ItemPedidoRequest, ItemTicketLocal, Pedido, TipoEntrega, MetodoPago } from '../models/pedido.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class PosService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly apiUrl = environment.apiBaseUrl;

  // Catálogos
  public readonly sabores = signal<Sabor[]>([]);
  public readonly presentaciones = signal<Presentacion[]>([]);
  public readonly toppings = signal<Topping[]>([]);
  public readonly productosSimples = signal<ProductoSimple[]>([]);
  public readonly cargandoCatalogos = signal<boolean>(false);
  public readonly guardandoPedido = signal<boolean>(false);

  // Armado actual de helado
  public readonly selectedPresentacion = signal<Presentacion | null>(null);
  public readonly selectedSabores = signal<Sabor[]>([]);
  public readonly selectedToppings = signal<Topping[]>([]);

  // Carrito / Ticket de venta
  public readonly ticketItems = signal<ItemTicketLocal[]>([]);

  // Computed properties
  public readonly saboresDisponibles = computed(() => {
    return this.sabores().filter(s => s.disponible);
  });

  public readonly presentacionesActivas = computed(() => {
    return this.presentaciones().filter(p => p.activo);
  });

  public readonly toppingsDisponibles = computed(() => {
    return this.toppings().filter(t => t.disponible);
  });

  public readonly productosSimplesActivos = computed(() => {
    return this.productosSimples().filter(p => p.activo);
  });

  public readonly maxSaboresPermitidos = computed(() => {
    return this.selectedPresentacion()?.maxSabores ?? 0;
  });

  public readonly cantidadSaboresSeleccionados = computed(() => {
    return this.selectedSabores().length;
  });

  public readonly puedeAgregarMasSabores = computed(() => {
    const max = this.maxSaboresPermitidos();
    return max > 0 && this.cantidadSaboresSeleccionados() < max;
  });

  public readonly totalTicket = computed(() => {
    return this.ticketItems().reduce((acc, item) => acc + item.subtotal, 0);
  });

  public readonly cantidadTotalItems = computed(() => {
    return this.ticketItems().reduce((acc, item) => acc + item.cantidad, 0);
  });

  cargarCatalogos(): void {
    this.cargandoCatalogos.set(true);

    forkJoin({
      sabores: this.http.get<Sabor[]>(`${this.apiUrl}/api/sabores`).pipe(catchError(() => of([]))),
      presentaciones: this.http.get<Presentacion[]>(`${this.apiUrl}/api/presentaciones`).pipe(catchError(() => of([]))),
      toppings: this.http.get<Topping[]>(`${this.apiUrl}/api/toppings`).pipe(catchError(() => of([]))),
      productos: this.http.get<ProductoSimple[]>(`${this.apiUrl}/api/productos-simples`).pipe(catchError(() => of([])))
    }).subscribe({
      next: (res) => {
        this.sabores.set(res.sabores || []);
        this.presentaciones.set(res.presentaciones || []);
        this.toppings.set(res.toppings || []);
        this.productosSimples.set(res.productos || []);
        this.cargandoCatalogos.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar catálogos del POS.');
        this.cargandoCatalogos.set(false);
      }
    });
  }

  // --- Lógica de Armado de Helado ---
  seleccionarPresentacion(p: Presentacion): void {
    if (p.stock !== undefined && p.stock <= 0) {
      this.toast.warning(`No hay envases o cucuruchos disponibles para "${p.nombre}".`);
      return;
    }
    this.selectedPresentacion.set(p);
    // Si ya había seleccionado más sabores que los permitidos por la nueva presentación, recortar
    const saboresActuales = this.selectedSabores();
    if (saboresActuales.length > p.maxSabores) {
      this.selectedSabores.set(saboresActuales.slice(0, p.maxSabores));
    }
  }

  toggleSabor(sabor: Sabor): void {
    if (!sabor.disponible || (sabor.stockKilos !== undefined && sabor.stockKilos <= 0)) {
      this.toast.warning(`El sabor "${sabor.nombre}" no tiene stock disponible.`);
      return;
    }

    const actuales = this.selectedSabores();
    const yaSeleccionado = actuales.some(s => s.id === sabor.id);

    if (yaSeleccionado) {
      this.selectedSabores.set(actuales.filter(s => s.id !== sabor.id));
    } else {
      const max = this.maxSaboresPermitidos();
      if (!this.selectedPresentacion()) {
        this.toast.info('Por favor, selecciona primero un envase o presentación.');
        return;
      }
      if (actuales.length >= max) {
        this.toast.warning(`Esta presentación permite un máximo de ${max} sabor(es).`);
        return;
      }
      this.selectedSabores.set([...actuales, sabor]);
    }
  }

  toggleTopping(topping: Topping): void {
    if (!topping.disponible) {
      this.toast.warning(`El topping "${topping.nombre}" no está disponible.`);
      return;
    }
    const actuales = this.selectedToppings();
    const yaEsta = actuales.some(t => t.id === topping.id);
    if (yaEsta) {
      this.selectedToppings.set(actuales.filter(t => t.id !== topping.id));
    } else {
      this.selectedToppings.set([...actuales, topping]);
    }
  }

  resetArmadoHelado(): void {
    this.selectedPresentacion.set(null);
    this.selectedSabores.set([]);
    this.selectedToppings.set([]);
  }

  agregarHeladoAlTicket(): boolean {
    const pres = this.selectedPresentacion();
    const sab = this.selectedSabores();
    const top = this.selectedToppings();

    if (!pres) {
      this.toast.warning('Selecciona una presentación de helado.');
      return false;
    }
    if (sab.length === 0) {
      this.toast.warning('Selecciona al menos 1 sabor.');
      return false;
    }

    const extraToppings = top.reduce((acc, t) => acc + (t.precioExtra || 0), 0);
    const precioUnitario = pres.precio + extraToppings;

    const item: ItemTicketLocal = {
      idLocal: Math.random().toString(36).substring(2, 9),
      tipoItem: 'HELADO',
      presentacion: pres,
      sabores: [...sab],
      toppings: [...top],
      cantidad: 1,
      precioUnitario,
      subtotal: precioUnitario
    };

    this.ticketItems.update(items => [...items, item]);
    this.resetArmadoHelado();
    this.toast.success(`Agregado: ${pres.nombre} con ${sab.length} sabor(es)`);
    return true;
  }

  // --- Lógica de Productos Simples ---
  agregarProductoSimple(producto: ProductoSimple, cantidad: number = 1): void {
    if (!producto.activo) {
      this.toast.warning(`El producto "${producto.nombre}" está inactivo.`);
      return;
    }
    if (producto.stock <= 0) {
      this.toast.warning(`Sin stock suficiente para "${producto.nombre}".`);
      return;
    }

    const items = this.ticketItems();
    const itemExistente = items.find(i => i.tipoItem === 'PRODUCTO_SIMPLE' && i.productoSimple?.id === producto.id);

    if (itemExistente) {
      if (itemExistente.cantidad + cantidad > producto.stock) {
        this.toast.warning(`Solo hay ${producto.stock} unidad(es) disponibles en stock.`);
        return;
      }
      this.actualizarCantidad(itemExistente.idLocal, 1);
    } else {
      const nuevoItem: ItemTicketLocal = {
        idLocal: Math.random().toString(36).substring(2, 9),
        tipoItem: 'PRODUCTO_SIMPLE',
        productoSimple: producto,
        sabores: [],
        toppings: [],
        cantidad: 1,
        precioUnitario: producto.precio,
        subtotal: producto.precio
      };
      this.ticketItems.update(list => [...list, nuevoItem]);
      this.toast.success(`Agregado: ${producto.nombre}`);
    }
  }

  // --- Gestión del Ticket ---
  actualizarCantidad(idLocal: string, delta: number): void {
    this.ticketItems.update(items => {
      return items.map(item => {
        if (item.idLocal === idLocal) {
          const nuevaCantidad = item.cantidad + delta;
          if (nuevaCantidad <= 0) return null; // Eliminar
          // Control de stock si es producto simple
          if (item.tipoItem === 'PRODUCTO_SIMPLE' && item.productoSimple) {
            if (nuevaCantidad > item.productoSimple.stock) {
              this.toast.warning(`Stock máximo alcanzado (${item.productoSimple.stock} unid).`);
              return item;
            }
          }
          return {
            ...item,
            cantidad: nuevaCantidad,
            subtotal: nuevaCantidad * item.precioUnitario
          };
        }
        return item;
      }).filter((item): item is ItemTicketLocal => item !== null);
    });
  }

  eliminarItem(idLocal: string): void {
    this.ticketItems.update(items => items.filter(i => i.idLocal !== idLocal));
  }

  limpiarTicket(): void {
    this.ticketItems.set([]);
  }

  // --- Confirmar y Registrar Pedido ---
  registrarPedido(datosVenta: {
    clienteNombre?: string;
    tipoEntrega: TipoEntrega;
    metodoPago: MetodoPago;
    notas?: string;
  }): Observable<Pedido> {
    const items = this.ticketItems();
    if (items.length === 0) {
      throw new Error('El ticket está vacío.');
    }

    const payloadItems: ItemPedidoRequest[] = items.map(item => {
      if (item.tipoItem === 'HELADO') {
        return {
          tipoItem: 'HELADO',
          presentacionId: item.presentacion?.id,
          saborIds: item.sabores.map(s => s.id),
          toppingIds: item.toppings.map(t => t.id),
          cantidad: item.cantidad
        };
      } else {
        return {
          tipoItem: 'PRODUCTO_SIMPLE',
          productoSimpleId: item.productoSimple?.id,
          cantidad: item.cantidad
        };
      }
    });

    const request: CrearPedidoRequest = {
      clienteNombre: datosVenta.clienteNombre?.trim() || undefined,
      tipoEntrega: datosVenta.tipoEntrega,
      metodoPago: datosVenta.metodoPago,
      notas: datosVenta.notas?.trim() || undefined,
      items: payloadItems
    };

    this.guardandoPedido.set(true);

    return this.http.post<Pedido>(`${this.apiUrl}/api/pedidos`, request).pipe(
      tap(() => {
        this.limpiarTicket();
        this.guardandoPedido.set(false);
      }),
      catchError(err => {
        this.guardandoPedido.set(false);
        throw err;
      })
    );
  }
}
