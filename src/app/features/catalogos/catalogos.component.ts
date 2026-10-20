import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CatalogosService } from '../../core/services/catalogos.service';
import { ProductosService } from '../../core/services/productos.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Sabor } from '../../core/models/sabor.model';
import { Presentacion } from '../../core/models/presentacion.model';
import { Topping } from '../../core/models/topping.model';
import { ProductoSimple } from '../../core/models/producto-simple.model';
import { Producto, ProductoRequest, TipoArticulo, UnidadMedida, ProveedorVinculado } from '../../core/models/producto.model';
import { Proveedor } from '../../core/models/proveedor.model';
import { ProveedoresService } from '../../core/services/proveedores.service';
import { CategoriasService } from '../../core/services/categorias.service';
import { Categoria, CategoriaRequest } from '../../core/models/categoria.model';
import { TipoIva, OPCIONES_TIPO_IVA } from '../../core/models/tipo-iva.model';
import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { AppModalComponent } from '../../shared/components/modal/modal.component';
import { AppCurrencyPipe } from '../../shared/pipes/currency-format.pipe';

export interface AsignarProveedorItem {
  proveedorId: number;
  razonSocial?: string;
  ruc?: string;
  codigoReferencia?: string | null;
  costoCompra?: number | null;
  esPrincipal: boolean;
}

export interface ProductoMaestroFormModel {
  nombre: string;
  descripcion?: string | null;
  categoria?: string | null;
  tipoArticulo: TipoArticulo;
  unidadMedida: UnidadMedida;
  codigoBarra: string;
  sku: string;
  precioVenta: number;
  precioCosto: number;
  margenPorcentaje: number;
  tipoIva: TipoIva;
  stock: number;
  stockMinimo: number;
  activo: boolean;
  maxSabores?: number | null;
  pesoGramosAprox?: number | null;
  categoriaSabor?: any;
  aptoCeliaco?: boolean;
  esVegano?: boolean;
  sinAzucar?: boolean;
  proveedoresList: AsignarProveedorItem[];
}

@Component({
  selector: 'app-catalogos',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, AppModalComponent, AppCurrencyPipe],
  template: `
    <div class="catalogos-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Catálogo y Disponibilidad</h1>
          <p class="page-subtitle">Administra el catálogo maestro ERP, sabores, envases, toppings y cafetería</p>
        </div>

        <div class="header-actions">
          @if (tabActiva() === 'maestro' && authService.hasPermission('productos')) {
            <button type="button" class="btn btn-primary" (click)="abrirModalMaestroCrear()">
              <app-icon name="plus" [size]="16" />
              <span>Nuevo Artículo ERP</span>
            </button>
          } @else if (tabActiva() === 'sabores' && authService.hasPermission('sabores')) {
            <button type="button" class="btn btn-primary" (click)="abrirModalSabor()">
              <app-icon name="plus" [size]="16" />
              <span>Nuevo Sabor</span>
            </button>
          } @else if (tabActiva() === 'presentaciones' && authService.hasPermission('presentaciones')) {
            <button type="button" class="btn btn-primary" (click)="abrirModalPresentacion()">
              <app-icon name="plus" [size]="16" />
              <span>Nuevo Envase</span>
            </button>
          } @else if (tabActiva() === 'toppings' && authService.hasPermission('toppings')) {
            <button type="button" class="btn btn-primary" (click)="abrirModalTopping()">
              <app-icon name="plus" [size]="16" />
              <span>Nuevo Topping</span>
            </button>
          } @else if (tabActiva() === 'productos' && authService.hasPermission('productos')) {
            <button type="button" class="btn btn-primary" (click)="abrirModalProducto()">
              <app-icon name="plus" [size]="16" />
              <span>Nuevo Producto</span>
            </button>
          } @else if (tabActiva() === 'categorias' && authService.hasPermission('categorias')) {
            <button type="button" class="btn btn-primary" (click)="abrirModalCategoria()">
              <app-icon name="plus" [size]="16" />
              <span>Nueva Categoría</span>
            </button>
          }

          <div class="tabs-nav">
            @if (authService.hasPermission('productos')) {
              <button 
                type="button" 
                class="tab-btn" 
                [class.active]="tabActiva() === 'maestro'"
                (click)="tabActiva.set('maestro')"
              >
                <app-icon name="package" [size]="16" />
                <span>Maestro ERP ({{ productosService.productos().length }})</span>
              </button>
            }
            @if (authService.hasPermission('sabores')) {
              <button 
                type="button" 
                class="tab-btn" 
                [class.active]="tabActiva() === 'sabores'"
                (click)="tabActiva.set('sabores')"
              >
                <app-icon name="ice-cream" [size]="16" />
                <span>Sabores ({{ catalogosService.sabores().length }})</span>
              </button>
            }
            @if (authService.hasPermission('presentaciones')) {
              <button 
                type="button" 
                class="tab-btn" 
                [class.active]="tabActiva() === 'presentaciones'"
                (click)="tabActiva.set('presentaciones')"
              >
                <app-icon name="cup-soda" [size]="16" />
                <span>Envases ({{ catalogosService.presentaciones().length }})</span>
              </button>
            }
            @if (authService.hasPermission('toppings')) {
              <button 
                type="button" 
                class="tab-btn" 
                [class.active]="tabActiva() === 'toppings'"
                (click)="tabActiva.set('toppings')"
              >
                <app-icon name="sparkles" [size]="16" />
                <span>Toppings ({{ catalogosService.toppings().length }})</span>
              </button>
            }
            @if (authService.hasPermission('productos')) {
              <button 
                type="button" 
                class="tab-btn" 
                [class.active]="tabActiva() === 'productos'"
                (click)="tabActiva.set('productos')"
              >
                <app-icon name="coffee" [size]="16" />
                <span>Cafetería ({{ catalogosService.productosSimples().length }})</span>
              </button>
            }
            @if (authService.hasPermission('categorias')) {
              <button 
                type="button" 
                class="tab-btn" 
                [class.active]="tabActiva() === 'categorias'"
                (click)="tabActiva.set('categorias')"
              >
                <app-icon name="tag" [size]="16" />
                <span>Categorías ({{ categoriasService.categorias().length }})</span>
              </button>
            }
          </div>
        </div>
      </div>

      <!-- VISTA MAESTRO ERP -->
      @if (tabActiva() === 'maestro') {
        <div class="card">
          <div class="card-header space-between flex-wrap gap-3">
            <div>
              <h3>Catálogo Maestro de Artículos (ERP Retail)</h3>
              <p class="section-subtitle">
                Mostrando {{ productosMaestrosFiltrados().length }} de {{ productosService.productos().length }} artículos (gestión unificada de ventas, compras y multiproveedor)
              </p>
            </div>
            
            <div class="table-filters flex-wrap gap-2">
              <!-- Búsqueda libre -->
              <div class="search-box-sm">
                <app-icon name="search" [size]="14" extraClass="search-icon-sm" />
                <input
                  type="text"
                  class="search-input-sm"
                  placeholder="Buscar por código, SKU o nombre..."
                  [ngModel]="filtroMaestroBuscar()"
                  (ngModelChange)="filtroMaestroBuscar.set($event)"
                />
                @if (filtroMaestroBuscar()) {
                  <button type="button" class="btn-clear-sm" (click)="filtroMaestroBuscar.set('')">
                    <app-icon name="x" [size]="12" />
                  </button>
                }
              </div>

              <!-- Filtro Tipo de Artículo -->
              <div class="filter-provider-box">
                <label for="filtroTipoSelect" class="filter-label">
                  <app-icon name="filter" [size]="14" />
                  <span>Tipo:</span>
                </label>
                <select 
                  id="filtroTipoSelect" 
                  class="select-provider-filter"
                  [ngModel]="filtroMaestroTipo()"
                  (ngModelChange)="filtroMaestroTipo.set($event)"
                >
                  <option value="TODOS">Todos los tipos</option>
                  <option value="VENTA_DIRECTA">Venta Directa / Bebidas</option>
                  <option value="ENVASE">Envases / Potes</option>
                  <option value="SABOR">Sabores de Helado</option>
                  <option value="TOPPING">Toppings / Agregados</option>
                  <option value="INSUMO">Insumos / Materia Prima</option>
                </select>
              </div>

              <!-- Filtro Proveedor -->
              <div class="filter-provider-box">
                <label for="filtroMaestroProvSelect" class="filter-label">
                  <app-icon name="truck" [size]="14" />
                  <span>Proveedor:</span>
                </label>
                <select 
                  id="filtroMaestroProvSelect" 
                  class="select-provider-filter"
                  [ngModel]="filtroMaestroProveedorId()"
                  (ngModelChange)="filtroMaestroProveedorId.set($event)"
                >
                  <option value="TODOS">Todos los proveedores</option>
                  <option value="SIN_PROVEEDOR">Sin proveedor asignado</option>
                  @for (prov of proveedoresService.proveedores(); track prov.id) {
                    <option [value]="prov.id.toString()">{{ prov.razonSocial }}</option>
                  }
                </select>
              </div>

              @if (filtroMaestroTipo() !== 'TODOS' || filtroMaestroProveedorId() !== 'TODOS' || filtroMaestroBuscar()) {
                <button 
                  type="button" 
                  class="btn btn-sm btn-ghost text-primary font-bold" 
                  (click)="limpiarFiltrosMaestro()"
                  title="Restablecer filtros"
                >
                  <app-icon name="x" [size]="14" />
                  <span>Limpiar</span>
                </button>
              }

              <button type="button" class="btn btn-sm btn-secondary" (click)="productosService.cargarProductos()">
                <app-icon name="refresh" [size]="14" />
                <span>Refrescar</span>
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table-custom">
              <thead>
                <tr>
                  <th>Artículo</th>
                  <th>Tipo</th>
                  <th>Cód. Barra / SKU</th>
                  <th>Proveedores Vinculados</th>
                  <th>Costo Compra</th>
                  <th>Precio Venta</th>
                  <th>Stock Actual</th>
                  <th>IVA</th>
                  <th>Estado</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (prod of productosMaestrosFiltrados(); track prod.id) {
                  <tr>
                    <td>
                      <div>
                        <div class="d-flex align-center gap-1">
                          <strong>{{ prod.nombre }}</strong>
                          @if (prod.categoria) {
                            <span class="category-chip" style="font-size: 0.7rem; padding: 1px 6px;">{{ prod.categoria }}</span>
                          }
                        </div>
                        @if (prod.descripcion) {
                          <div class="text-muted text-xs">{{ prod.descripcion }}</div>
                        }
                      </div>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="obtenerClaseTipoArticulo(prod.tipoArticulo)">
                        {{ obtenerTextoTipoArticulo(prod.tipoArticulo) }}
                      </span>
                    </td>
                    <td>
                      <div class="d-flex flex-column gap-1">
                        @if (prod.codigoBarra) {
                          <span class="barcode-badge">
                            <app-icon name="barcode" [size]="12" />
                            <span>{{ prod.codigoBarra }}</span>
                          </span>
                        }
                        @if (prod.sku) {
                          <span class="code-badge-inline" title="Código SKU / Referencia POS">{{ prod.sku }}</span>
                        }
                        @if (!prod.codigoBarra && !prod.sku) {
                          <span class="text-muted">—</span>
                        }
                      </div>
                    </td>
                    <td>
                      <div class="suppliers-pill-list">
                        @if (prod.proveedores && prod.proveedores.length > 0) {
                          @for (pv of prod.proveedores; track pv.proveedorId) {
                            <span 
                              class="supplier-pill" 
                              [class.supplier-pill-principal]="pv.esPrincipal"
                              [title]="(pv.esPrincipal ? 'Proveedor Principal. ' : 'Proveedor Alternativo. ') + (pv.costoCompra ? 'Costo: ' + pv.costoCompra + ' Gs.' : '')"
                              (click)="filtroMaestroProveedorId.set(pv.proveedorId.toString())"
                            >
                              @if (pv.esPrincipal) { <span class="star-icon">⭐</span> }
                              <span>{{ pv.razonSocial }}</span>
                              @if (pv.costoCompra) {
                                <span class="cost-tag">{{ pv.costoCompra | appCurrency }}</span>
                              }
                            </span>
                          }
                        } @else {
                          <span class="text-muted text-xs">Sin proveedor asignado</span>
                        }
                      </div>
                    </td>
                    <td>
                      @if (prod.proveedorPrincipal?.costoCompra) {
                        <span class="font-bold text-muted">{{ prod.proveedorPrincipal?.costoCompra | appCurrency }}</span>
                      } @else if (prod.precioCosto) {
                        <span class="font-bold text-muted">{{ prod.precioCosto | appCurrency }}</span>
                      } @else {
                        <span class="text-muted">—</span>
                      }
                    </td>
                    <td class="text-primary font-bold">
                      {{ prod.precioVenta | appCurrency }}
                    </td>
                    <td>
                      <span class="font-bold" [class.text-danger]="prod.stock <= 0">
                        {{ prod.stock }} {{ prod.unidadMedida ? prod.unidadMedida.toLowerCase() : 'unid' }}
                      </span>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="obtenerClaseBadgeIva(prod.tipoIva)">
                        {{ obtenerTextoIva(prod.tipoIva) }}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        class="badge cursor-pointer"
                        [ngClass]="prod.activo ? 'badge-listo' : 'badge-cancelado'"
                        (click)="cambiarEstadoProductoMaestro(prod)"
                        title="Clic para cambiar estado activo/inactivo"
                      >
                        {{ prod.activo ? 'Activo' : 'Inactivo' }}
                      </button>
                    </td>
                    <td class="text-right">
                      <div class="actions-cell">
                        <button
                          type="button"
                          class="btn btn-sm btn-secondary"
                          (click)="abrirModalMaestroEditar(prod)"
                          title="Editar artículo y proveedores"
                        >
                          <app-icon name="edit" [size]="14" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          class="btn-icon-danger"
                          (click)="confirmarEliminarProductoMaestro(prod)"
                          title="Eliminar artículo del catálogo"
                        >
                          <app-icon name="trash" [size]="14" />
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="10" class="text-center py-5">
                      <div class="empty-filter-state">
                        <app-icon name="package" [size]="36" />
                        <h4 class="mt-2">No se encontraron artículos</h4>
                        <p class="text-muted">No hay artículos que coincidan con los criterios de búsqueda o filtros.</p>
                        <button type="button" class="btn btn-sm btn-primary mt-2" (click)="abrirModalMaestroCrear()">
                          <app-icon name="plus" [size]="14" />
                          <span>Crear Nuevo Artículo</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- VISTA SABORES -->
      @if (tabActiva() === 'sabores') {
        <div class="card">
          <div class="card-header space-between">
            <h3>Listado de Sabores de Helado</h3>
            <button type="button" class="btn btn-sm btn-secondary" (click)="catalogosService.cargarSabores()">
              <app-icon name="refresh" [size]="14" />
              <span>Refrescar</span>
            </button>
          </div>
          <div class="table-responsive">
            <table class="table-custom">
              <thead>
                <tr>
                  <th>Sabor</th>
                  <th>Categoría</th>
                  <th>Stock en Bacha</th>
                  <th>Dietario</th>
                  <th>Disponibilidad</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (sabor of catalogosService.sabores(); track sabor.id) {
                  <tr>
                    <td>
                      <div>
                        <strong>{{ sabor.nombre }}</strong>
                        @if (sabor.descripcion) {
                          <div class="text-muted text-sm">{{ sabor.descripcion }}</div>
                        }
                      </div>
                    </td>
                    <td><span class="category-chip">{{ sabor.categoria }}</span></td>
                    <td>
                      <span class="font-bold" [class.text-danger]="(sabor.stockKilos ?? 0) <= 0">
                        {{ sabor.stockKilos ?? 0 }} kg
                      </span>
                    </td>
                    <td>
                      <div class="d-flex gap-1 flex-wrap">
                        @if (sabor.aptoCeliaco) { <span class="badge badge-celiaco">Sin TACC</span> }
                        @if (sabor.esVegano) { <span class="badge badge-vegano">Vegano</span> }
                        @if (sabor.sinAzucar) { <span class="badge badge-sinazucar">Sin Azúcar</span> }
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        class="badge cursor-pointer"
                        [ngClass]="sabor.disponible ? 'badge-listo' : 'badge-cancelado'"
                        (click)="toggleDisponibilidadSabor(sabor)"
                        title="Clic para cambiar disponibilidad"
                      >
                        {{ sabor.disponible ? 'Disponible' : 'Agotado' }}
                      </button>
                    </td>
                    <td class="text-right">
                      <div class="actions-cell">
                        <button
                          type="button"
                          class="btn btn-sm btn-secondary"
                          (click)="abrirModalSabor(sabor)"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          class="btn-icon-danger"
                          (click)="confirmarEliminarSabor(sabor)"
                          title="Eliminar sabor"
                        >
                          <app-icon name="trash" [size]="14" />
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- VISTA PRESENTACIONES -->
      @if (tabActiva() === 'presentaciones') {
        <div class="card">
          <div class="card-header space-between">
            <h3>Tamaños y Envases</h3>
            <button type="button" class="btn btn-sm btn-secondary" (click)="catalogosService.cargarPresentaciones()">
              <app-icon name="refresh" [size]="14" />
              <span>Refrescar</span>
            </button>
          </div>
          <div class="table-responsive">
            <table class="table-custom">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Stock Físico</th>
                  <th>Máx. Sabores</th>
                  <th>Peso Aprox.</th>
                  <th>IVA</th>
                  <th>Estado</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (pres of catalogosService.presentaciones(); track pres.id) {
                  <tr>
                    <td>
                      <div class="d-flex align-center gap-2">
                        <span class="code-badge-inline" title="Código de producto POS">H-{{ pres.id }}</span>
                        <strong>{{ pres.nombre }}</strong>
                      </div>
                    </td>
                    <td class="text-primary font-bold">{{ pres.precio | appCurrency }}</td>
                    <td>
                      <span class="font-bold" [class.text-danger]="(pres.stock ?? 0) <= 0">
                        {{ pres.stock ?? 0 }} unid.
                      </span>
                    </td>
                    <td>Hasta {{ pres.maxSabores }} sabores</td>
                    <td>{{ pres.pesoGramosAprox ? pres.pesoGramosAprox + 'g' : '-' }}</td>
                    <td>
                      <span class="badge" [ngClass]="obtenerClaseBadgeIva(pres.tipoIva)">
                        {{ obtenerTextoIva(pres.tipoIva) }}
                      </span>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="pres.activo ? 'badge-listo' : 'badge-cancelado'">
                        {{ pres.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="text-right">
                      <div class="actions-cell">
                        <button
                          type="button"
                          class="btn btn-sm btn-secondary"
                          (click)="abrirModalPresentacion(pres)"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          class="btn-icon-danger"
                          (click)="confirmarEliminarPresentacion(pres)"
                          title="Eliminar presentación"
                        >
                          <app-icon name="trash" [size]="14" />
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- VISTA TOPPINGS -->
      @if (tabActiva() === 'toppings') {
        <div class="card">
          <div class="card-header space-between">
            <h3>Toppings y Agregados</h3>
            <button type="button" class="btn btn-sm btn-secondary" (click)="catalogosService.cargarToppings()">
              <app-icon name="refresh" [size]="14" />
              <span>Refrescar</span>
            </button>
          </div>
          <div class="table-responsive">
            <table class="table-custom">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Precio Extra</th>
                  <th>Disponibilidad</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (top of catalogosService.toppings(); track top.id) {
                  <tr>
                    <td>
                      <div class="d-flex align-center gap-2">
                        <span class="code-badge-inline" title="Código de producto POS">T-{{ top.id }}</span>
                        <strong>{{ top.nombre }}</strong>
                      </div>
                    </td>
                    <td class="text-primary font-bold">+ {{ top.precioExtra | appCurrency }}</td>
                    <td>
                      <button
                        type="button"
                        class="badge cursor-pointer"
                        [ngClass]="top.disponible ? 'badge-listo' : 'badge-cancelado'"
                        (click)="toggleDisponibilidadTopping(top)"
                        title="Clic para cambiar disponibilidad"
                      >
                        {{ top.disponible ? 'Disponible' : 'Agotado' }}
                      </button>
                    </td>
                    <td class="text-right">
                      <div class="actions-cell">
                        <button
                          type="button"
                          class="btn btn-sm btn-secondary"
                          (click)="abrirModalTopping(top)"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          class="btn-icon-danger"
                          (click)="confirmarEliminarTopping(top)"
                          title="Eliminar topping"
                        >
                          <app-icon name="trash" [size]="14" />
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- VISTA PRODUCTOS SIMPLES -->
      @if (tabActiva() === 'productos') {
        <div class="card">
          <div class="card-header space-between flex-wrap gap-3">
            <div>
              <h3>Bebidas y Cafetería Envasada</h3>
              <p class="section-subtitle">
                Mostrando {{ productosFiltrados().length }} de {{ catalogosService.productosSimples().length }} productos
              </p>
            </div>
            
            <div class="table-filters">
              <div class="filter-provider-box">
                <label for="filtroProveedorSelect" class="filter-label">
                  <app-icon name="truck" [size]="14" />
                  <span>Proveedor:</span>
                </label>
                <select 
                  id="filtroProveedorSelect" 
                  class="select-provider-filter"
                  [ngModel]="filtroProveedorId()"
                  (ngModelChange)="filtroProveedorId.set($event)"
                >
                  <option value="TODOS">Todos los proveedores ({{ catalogosService.productosSimples().length }})</option>
                  <option value="SIN_PROVEEDOR">Sin proveedor asignado ({{ contarProductosSinProveedor() }})</option>
                  @for (prov of proveedoresService.proveedores(); track prov.id) {
                    <option [value]="prov.id.toString()">
                      {{ prov.razonSocial }} ({{ contarProductosPorProveedor(prov.id) }})
                    </option>
                  }
                </select>
              </div>

              @if (filtroProveedorId() !== 'TODOS') {
                <button 
                  type="button" 
                  class="btn btn-sm btn-ghost text-primary font-bold" 
                  (click)="filtroProveedorId.set('TODOS')"
                  title="Ver todos los productos"
                >
                  <app-icon name="x" [size]="14" />
                  <span>Ver Todos</span>
                </button>
              }

              <button type="button" class="btn btn-sm btn-secondary" (click)="catalogosService.cargarProductosSimples()">
                <app-icon name="refresh" [size]="14" />
                <span>Refrescar</span>
              </button>
            </div>
          </div>
          <div class="table-responsive">
            <table class="table-custom">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cód. Barra</th>
                  <th>Proveedor</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Stock Actual</th>
                  <th>Stock Mínimo</th>
                  <th>IVA</th>
                  <th>Estado</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (prod of productosFiltrados(); track prod.id) {
                  <tr>
                    <td>
                      <div class="d-flex align-center gap-2">
                        <span class="code-badge-inline" title="Código de producto POS">{{ prod.codigo || ('P-' + prod.id) }}</span>
                        <strong>{{ prod.nombre }}</strong>
                      </div>
                    </td>
                    <td>
                      @if (prod.codigoBarra) {
                        <span class="barcode-badge">
                          <app-icon name="barcode" [size]="14" />
                          <span>{{ prod.codigoBarra }}</span>
                        </span>
                      } @else {
                        <span class="text-muted">—</span>
                      }
                    </td>
                    <td>
                      @if (prod.proveedor) {
                        <span 
                          class="supplier-tag cursor-pointer" 
                          (click)="filtroProveedorId.set(prod.proveedor.id.toString())"
                          title="Filtrar por {{ prod.proveedor.razonSocial }}"
                        >
                          <app-icon name="truck" [size]="14" />
                          <span>{{ prod.proveedor.razonSocial }}</span>
                        </span>
                      } @else {
                        <span 
                          class="text-muted small cursor-pointer"
                          (click)="filtroProveedorId.set('SIN_PROVEEDOR')"
                          title="Filtrar productos sin proveedor"
                        >Sin asignar</span>
                      }
                    </td>
                    <td><span class="category-chip">{{ prod.categoria || 'BEBIDAS' }}</span></td>
                    <td class="text-primary font-bold">{{ prod.precio | appCurrency }}</td>
                    <td>
                      <span class="font-bold" [class.text-danger]="prod.stock <= 0">
                        {{ prod.stock }} unid.
                      </span>
                    </td>
                    <td>{{ prod.stockMinimo ?? 5 }} unid.</td>
                    <td>
                      <span class="badge" [ngClass]="obtenerClaseBadgeIva(prod.tipoIva)">
                        {{ obtenerTextoIva(prod.tipoIva) }}
                      </span>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="prod.activo ? 'badge-listo' : 'badge-cancelado'">
                        {{ prod.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="text-right">
                      <div class="actions-cell">
                        <button
                          type="button"
                          class="btn btn-sm btn-secondary"
                          (click)="abrirModalProducto(prod)"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          class="btn-icon-danger"
                          (click)="confirmarEliminarProducto(prod)"
                          title="Eliminar producto"
                        >
                          <app-icon name="trash" [size]="14" />
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="10" class="text-center py-5">
                      <div class="empty-filter-state">
                        <app-icon name="package" [size]="32" />
                        <p class="mt-2 text-muted">No se encontraron productos para el filtro seleccionado.</p>
                        <button type="button" class="btn btn-sm btn-secondary mt-2" (click)="filtroProveedorId.set('TODOS')">
                          Mostrar todos los productos
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- VISTA CATEGORÍAS -->
      @if (tabActiva() === 'categorias') {
        <div class="card">
          <div class="card-header space-between flex-wrap gap-3">
            <div>
              <h3>Gestión Dinámica de Categorías y Familias</h3>
              <p class="section-subtitle">
                Mostrando {{ categoriasFiltradas().length }} de {{ categoriasService.categorias().length }} categorías configuradas
              </p>
            </div>
            
            <div class="table-filters flex-wrap gap-2">
              <!-- Búsqueda libre -->
              <div class="search-box-sm">
                <app-icon name="search" [size]="14" extraClass="search-icon-sm" />
                <input
                  type="text"
                  class="search-input-sm"
                  placeholder="Buscar categoría..."
                  [ngModel]="filtroCategoriaBuscar()"
                  (ngModelChange)="filtroCategoriaBuscar.set($event)"
                />
                @if (filtroCategoriaBuscar()) {
                  <button type="button" class="btn-clear-sm" (click)="filtroCategoriaBuscar.set('')">
                    <app-icon name="x" [size]="12" />
                  </button>
                }
              </div>

              <!-- Filtro Tipo de Artículo -->
              <div class="filter-provider-box">
                <label for="filtroCategoriaTipoSelect" class="filter-label">
                  <app-icon name="filter" [size]="14" />
                  <span>Tipo:</span>
                </label>
                <select 
                  id="filtroCategoriaTipoSelect" 
                  class="select-provider-filter"
                  [ngModel]="filtroCategoriaTipo()"
                  (ngModelChange)="filtroCategoriaTipo.set($event)"
                >
                  <option value="TODOS">Todos los tipos</option>
                  <option value="SABOR">Sabores de Helado</option>
                  <option value="VENTA_DIRECTA">Venta Directa / Cafetería</option>
                  <option value="ENVASE">Envases / Potes</option>
                  <option value="TOPPING">Toppings / Agregados</option>
                  <option value="INSUMO">Insumos / Materia Prima</option>
                  <option value="GENERAL">General / Sin Tipo Fijo</option>
                </select>
              </div>

              @if (filtroCategoriaBuscar() || filtroCategoriaTipo() !== 'TODOS') {
                <button 
                  type="button" 
                  class="btn btn-sm btn-ghost text-primary font-bold" 
                  (click)="filtroCategoriaBuscar.set(''); filtroCategoriaTipo.set('TODOS')"
                  title="Restablecer filtros"
                >
                  <app-icon name="x" [size]="14" />
                  <span>Limpiar</span>
                </button>
              }

              <button type="button" class="btn btn-sm btn-secondary" (click)="categoriasService.cargarCategorias()">
                <app-icon name="refresh" [size]="14" />
                <span>Refrescar</span>
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table-custom">
              <thead>
                <tr>
                  <th>Nombre Categoría</th>
                  <th>Tipo de Artículo Aplicable</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (cat of categoriasFiltradas(); track cat.id) {
                  <tr>
                    <td>
                      <div class="d-flex align-center gap-2">
                        <app-icon name="tag" [size]="16" class="text-primary" />
                        <span class="font-bold">{{ cat.nombre }}</span>
                      </div>
                    </td>
                    <td>
                      @if (cat.tipoArticulo) {
                        <span class="badge" [ngClass]="obtenerClaseTipoArticulo(cat.tipoArticulo)">
                          {{ obtenerTextoTipoArticulo(cat.tipoArticulo) }}
                        </span>
                      } @else {
                        <span class="badge badge-tipo-default">General (Todos)</span>
                      }
                    </td>
                    <td>
                      <span class="text-muted">{{ cat.descripcion || '—' }}</span>
                    </td>
                    <td>
                      <span 
                        class="badge cursor-pointer" 
                        [ngClass]="cat.activo ? 'badge-listo' : 'badge-cancelado'"
                        (click)="toggleEstadoCategoria(cat)"
                        title="Haz clic para alternar estado activo/inactivo"
                      >
                        {{ cat.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="text-right">
                      <div class="actions-cell">
                        <button
                          type="button"
                          class="btn btn-sm btn-secondary"
                          (click)="abrirModalCategoria(cat)"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          class="btn-icon-danger"
                          (click)="confirmarEliminarCategoria(cat)"
                          title="Eliminar categoría"
                        >
                          <app-icon name="trash" [size]="14" />
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="text-center py-5">
                      <div class="empty-filter-state">
                        <app-icon name="tag" [size]="32" />
                        <p class="mt-2 text-muted">No se encontraron categorías con los filtros seleccionados.</p>
                        <button 
                          type="button" 
                          class="btn btn-sm btn-secondary mt-2" 
                          (click)="filtroCategoriaBuscar.set(''); filtroCategoriaTipo.set('TODOS')"
                        >
                          Limpiar filtros
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- MODAL SABOR -->
      <app-modal
        [isOpen]="modalSaborAbierto()"
        [title]="saborEditando?.id ? ('Modificar Sabor: ' + saborEditando?.nombre) : 'Nuevo Sabor de Helado'"
        size="lg"
        (close)="modalSaborAbierto.set(false)"
      >
        <div body class="form-grid">
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="catSaborNombre">Nombre del Sabor *</label>
              <input
                id="catSaborNombre"
                type="text"
                class="form-control"
                [(ngModel)]="saborForm.nombre"
                placeholder="Ej. Chocolate Marroc"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="catSaborCat">Categoría *</label>
              <select id="catSaborCat" class="form-control" [(ngModel)]="saborForm.categoria">
                <option value="CREMA">CREMA</option>
                <option value="CHOCOLATE">CHOCOLATE</option>
                <option value="DULCE_DE_LECHE">DULCE_DE_LECHE</option>
                <option value="FRUTAL">FRUTAL</option>
                <option value="ESPECIAL">ESPECIAL</option>
                @for (c of categoriasService.categoriasSabores(); track c.id) {
                  @if (!['CREMA', 'CHOCOLATE', 'DULCE_DE_LECHE', 'FRUTAL', 'ESPECIAL'].includes(c.nombre)) {
                    <option [value]="c.nombre">{{ c.nombre }}</option>
                  }
                }
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="catSaborDesc">Descripción</label>
            <input
              id="catSaborDesc"
              type="text"
              class="form-control"
              [(ngModel)]="saborForm.descripcion"
              placeholder="Ingredientes y notas..."
            />
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="catSaborKg">Stock Kilos en Bacha *</label>
              <input
                id="catSaborKg"
                type="number"
                step="0.1"
                class="form-control"
                [(ngModel)]="saborForm.stockKilos"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="catSaborMinKg">Stock Mínimo (kg) *</label>
              <input
                id="catSaborMinKg"
                type="number"
                step="0.1"
                class="form-control"
                [(ngModel)]="saborForm.stockMinimoKilos"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Propiedades y Dietario</label>
            <div class="checkboxes-row">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="saborForm.aptoCeliaco" />
                <span>🌾 Sin TACC</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="saborForm.esVegano" />
                <span>🌱 Vegano</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="saborForm.sinAzucar" />
                <span>🍃 Sin Azúcar</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="saborForm.disponible" />
                <span>✅ Disponible</span>
              </label>
            </div>
          </div>
        </div>

        <div footer>
          <button type="button" class="btn btn-secondary" (click)="modalSaborAbierto.set(false)">Cancelar</button>
          <button type="button" class="btn btn-primary" (click)="guardarSabor()" [disabled]="guardandoItem()">
            <span>Guardar Sabor</span>
          </button>
        </div>
      </app-modal>

      <!-- MODAL PRESENTACION -->
      <app-modal
        [isOpen]="modalPresentacionAbierto()"
        [title]="presentacionEditando?.id ? ('Modificar Envase: ' + presentacionEditando?.nombre) : 'Nuevo Envase / Cucurucho'"
        size="md"
        (close)="modalPresentacionAbierto.set(false)"
      >
        <div body class="form-grid">
          <div class="form-group">
            <label class="form-label" for="catPresNombre">Nombre *</label>
            <input id="catPresNombre" type="text" class="form-control" [(ngModel)]="presentacionForm.nombre" />
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="catPresPrecio">Precio (Gs.) *</label>
              <input id="catPresPrecio" type="number" step="1000" class="form-control" [(ngModel)]="presentacionForm.precio" />
            </div>
            <div class="form-group">
              <label class="form-label" for="catPresMax">Máx. Sabores *</label>
              <input id="catPresMax" type="number" min="1" max="6" class="form-control" [(ngModel)]="presentacionForm.maxSabores" />
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="catPresPeso">Peso Aprox. (g)</label>
              <input id="catPresPeso" type="number" class="form-control" [(ngModel)]="presentacionForm.pesoGramosAprox" />
            </div>
            <div class="form-group">
              <label class="form-label" for="catPresStock">Stock Físico *</label>
              <input id="catPresStock" type="number" class="form-control" [(ngModel)]="presentacionForm.stock" />
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="catPresMin">Stock Mínimo *</label>
              <input id="catPresMin" type="number" class="form-control" [(ngModel)]="presentacionForm.stockMinimo" />
            </div>
            <div class="form-group">
              <label class="form-label" for="catPresIva">Tasa de Impuesto (IVA) *</label>
              <select id="catPresIva" class="form-control" [(ngModel)]="presentacionForm.tipoIva">
                @for (opc of opcionesIva; track opc.valor) {
                  <option [value]="opc.valor">{{ opc.label }}</option>
                }
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="presentacionForm.activo" />
              <span>✅ Activo</span>
            </label>
          </div>
        </div>

        <div footer>
          <button type="button" class="btn btn-secondary" (click)="modalPresentacionAbierto.set(false)">Cancelar</button>
          <button type="button" class="btn btn-primary" (click)="guardarPresentacion()" [disabled]="guardandoItem()">
            <span>Guardar Envase</span>
          </button>
        </div>
      </app-modal>

      <!-- MODAL TOPPING -->
      <app-modal
        [isOpen]="modalToppingAbierto()"
        [title]="toppingEditando?.id ? ('Modificar Topping: ' + toppingEditando?.nombre) : 'Nuevo Topping / Agregado'"
        size="md"
        (close)="modalToppingAbierto.set(false)"
      >
        <div body class="form-grid">
          <div class="form-group">
            <label class="form-label" for="catTopNombre">Nombre del Topping *</label>
            <input id="catTopNombre" type="text" class="form-control" [(ngModel)]="toppingForm.nombre" />
          </div>
          <div class="form-group">
            <label class="form-label" for="catTopPrecio">Precio Extra (Gs.) *</label>
            <input id="catTopPrecio" type="number" step="500" class="form-control" [(ngModel)]="toppingForm.precioExtra" />
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="toppingForm.disponible" />
              <span>✅ Disponible para la venta</span>
            </label>
          </div>
        </div>

        <div footer>
          <button type="button" class="btn btn-secondary" (click)="modalToppingAbierto.set(false)">Cancelar</button>
          <button type="button" class="btn btn-primary" (click)="guardarTopping()" [disabled]="guardandoItem()">
            <span>Guardar Topping</span>
          </button>
        </div>
      </app-modal>

      <!-- MODAL PRODUCTO SIMPLE -->
      <app-modal
        [isOpen]="modalProductoAbierto()"
        [title]="productoEditando?.id ? ('Modificar Producto: ' + productoEditando?.nombre) : 'Nuevo Producto / Cafetería'"
        size="md"
        (close)="modalProductoAbierto.set(false)"
      >
        <div body class="form-grid">
          <div class="form-group">
            <label class="form-label" for="catProdNombre">Nombre del Producto *</label>
            <input id="catProdNombre" type="text" class="form-control" [(ngModel)]="productoForm.nombre" />
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="catProdPrecio">Precio (Gs.) *</label>
              <input id="catProdPrecio" type="number" step="1000" class="form-control" [(ngModel)]="productoForm.precio" />
            </div>
            <div class="form-group">
              <label class="form-label" for="catProdCat">Categoría</label>
              <input
                id="catProdCat"
                type="text"
                list="listaCategoriasVentaDirecta"
                class="form-control"
                [(ngModel)]="productoForm.categoria"
                placeholder="Ej. BEBIDAS, CAFETERIA..."
              />
              <datalist id="listaCategoriasVentaDirecta">
                @for (c of categoriasService.categoriasVentaDirecta(); track c.id) {
                  <option [value]="c.nombre"></option>
                }
              </datalist>
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="catProdStock">Stock Actual *</label>
              <input id="catProdStock" type="number" class="form-control" [(ngModel)]="productoForm.stock" />
            </div>
            <div class="form-group">
              <label class="form-label" for="catProdMin">Stock Mínimo *</label>
              <input id="catProdMin" type="number" class="form-control" [(ngModel)]="productoForm.stockMinimo" />
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label d-flex align-center gap-1" for="catProdCodigo">
                <app-icon name="hash" [size]="14" />
                <span>Cód. Producto / ID Rápido</span>
              </label>
              <input
                id="catProdCodigo"
                type="text"
                class="form-control"
                [placeholder]="productoEditando?.id ? ('P-' + productoEditando?.id) : 'Ej. CAF-01 o automático'"
                [(ngModel)]="productoForm.codigo"
              />
            </div>
            <div class="form-group">
              <label class="form-label d-flex align-center gap-1" for="catProdCodigoBarra">
                <app-icon name="barcode" [size]="14" />
                <span>Código de Barra</span>
              </label>
              <input
                id="catProdCodigoBarra"
                type="text"
                class="form-control"
                placeholder="Ej. 7840001001"
                [(ngModel)]="productoForm.codigoBarra"
              />
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label d-flex align-center gap-1" for="catProdProveedor">
                <app-icon name="truck" [size]="14" />
                <span>Proveedor Asignado</span>
              </label>
              <select id="catProdProveedor" class="form-control" [(ngModel)]="productoForm.proveedorId">
                <option [ngValue]="null">-- Sin Proveedor Asignado --</option>
                @for (prov of proveedoresService.proveedores(); track prov.id) {
                  <option [ngValue]="prov.id">{{ prov.razonSocial }} ({{ prov.ruc }})</option>
                }
              </select>
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="catProdIva">Tasa de Impuesto (IVA) *</label>
              <select id="catProdIva" class="form-control" [(ngModel)]="productoForm.tipoIva">
                @for (opc of opcionesIva; track opc.valor) {
                  <option [value]="opc.valor">{{ opc.label }}</option>
                }
              </select>
            </div>
            <div class="form-group d-flex align-center">
              <label class="checkbox-label mt-4">
                <input type="checkbox" [(ngModel)]="productoForm.activo" />
                <span>✅ Activo</span>
              </label>
            </div>
          </div>
        </div>

        <div footer>
          <button type="button" class="btn btn-secondary" (click)="modalProductoAbierto.set(false)">Cancelar</button>
          <button type="button" class="btn btn-primary" (click)="guardarProducto()" [disabled]="guardandoItem()">
            <span>Guardar Producto</span>
          </button>
        </div>
      </app-modal>

      <!-- MODAL ARTICULO MAESTRO ERP -->
      <app-modal
        [isOpen]="modalMaestroAbierto()"
        [title]="productoMaestroEditando?.id ? ('Modificar Artículo ERP: ' + productoMaestroEditando?.nombre) : 'Nuevo Artículo en Catálogo Maestro'"
        size="lg"
        (close)="modalMaestroAbierto.set(false)"
      >
        <div body class="form-grid">
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="maestroNombre">Nombre del Artículo *</label>
              <input
                id="maestroNombre"
                type="text"
                class="form-control"
                [(ngModel)]="productoMaestroForm.nombre"
                placeholder="Ej. Pote Térmico 1 Kg / Café Espresso / Sabor Vainilla"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="maestroTipo">Tipo de Artículo (Categoría ERP) *</label>
              <select id="maestroTipo" class="form-control" [(ngModel)]="productoMaestroForm.tipoArticulo">
                <option value="VENTA_DIRECTA">Venta Directa / Cafetería Envasada</option>
                <option value="ENVASE">Envase / Pote de Helado</option>
                <option value="SABOR">Sabor de Helado</option>
                <option value="TOPPING">Topping / Agregado</option>
                <option value="INSUMO">Insumo / Materia Prima</option>
              </select>
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label" for="maestroCategoria">Categoría / Familia</label>
              <input
                id="maestroCategoria"
                type="text"
                list="listaCategoriasMaestro"
                class="form-control"
                [(ngModel)]="productoMaestroForm.categoria"
                placeholder="Selecciona o escribe..."
              />
              <datalist id="listaCategoriasMaestro">
                @for (c of categoriasPorTipo(productoMaestroForm.tipoArticulo); track c.id) {
                  <option [value]="c.nombre"></option>
                }
              </datalist>
            </div>
            <div class="form-group">
              <label class="form-label" for="maestroDesc">Descripción / Detalles</label>
              <input
                id="maestroDesc"
                type="text"
                class="form-control"
                [(ngModel)]="productoMaestroForm.descripcion"
                placeholder="Descripción comercial, notas o especificaciones..."
              />
            </div>
          </div>

          <!-- BLOQUE DE PRECIOS Y CÁLCULO DE MARGEN COMERCIAL -->
          <div class="pricing-calculator-card">
            <div class="pricing-card-header">
              <div class="d-flex align-center gap-2">
                <app-icon name="trending-up" [size]="16" />
                <span class="pricing-card-title">Precios y Margen de Ganancia</span>
              </div>
              @if (productoMaestroForm.precioCosto && productoMaestroForm.precioVenta) {
                <span class="profit-badge" [class.profit-positive]="calcularGananciaNeta() >= 0" [class.profit-negative]="calcularGananciaNeta() < 0">
                  Ganancia: {{ calcularGananciaNeta() >= 0 ? '+' : '' }}{{ calcularGananciaNeta() | appCurrency }} ({{ productoMaestroForm.margenPorcentaje }}%)
                </span>
              }
            </div>

            <div class="form-row-4">
              <div class="form-group">
                <label class="form-label" for="maestroUnidad">Unidad Medida *</label>
                <select id="maestroUnidad" class="form-control" [(ngModel)]="productoMaestroForm.unidadMedida">
                  <option value="UNIDAD">Unidades (UNID)</option>
                  <option value="KG">Kilogramos (KG)</option>
                  <option value="LITRO">Litros (L)</option>
                  <option value="GRAMO">Gramos (G)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="maestroPrecioCosto">Precio Costo (Gs.)</label>
                <input
                  id="maestroPrecioCosto"
                  type="number"
                  step="500"
                  class="form-control"
                  placeholder="0"
                  [(ngModel)]="productoMaestroForm.precioCosto"
                  (ngModelChange)="onCostoOMargenChange()"
                />
              </div>

              <div class="form-group">
                <div class="d-flex justify-content-between align-center mb-1">
                  <label class="form-label m-0" for="maestroMargen">% Margen</label>
                  <div class="quick-margins">
                    <button type="button" class="btn-margin-chip" [class.active-margin]="productoMaestroForm.margenPorcentaje === 15" (click)="aplicarMargenRapido(15)">15%</button>
                    <button type="button" class="btn-margin-chip" [class.active-margin]="productoMaestroForm.margenPorcentaje === 20" (click)="aplicarMargenRapido(20)">20%</button>
                    <button type="button" class="btn-margin-chip" [class.active-margin]="productoMaestroForm.margenPorcentaje === 30" (click)="aplicarMargenRapido(30)">30%</button>
                    <button type="button" class="btn-margin-chip" [class.active-margin]="productoMaestroForm.margenPorcentaje === 50" (click)="aplicarMargenRapido(50)">50%</button>
                  </div>
                </div>
                <div class="input-with-suffix">
                  <input
                    id="maestroMargen"
                    type="number"
                    step="1"
                    min="0"
                    max="1000"
                    class="form-control"
                    placeholder="20"
                    [(ngModel)]="productoMaestroForm.margenPorcentaje"
                    (ngModelChange)="onCostoOMargenChange()"
                  />
                  <span class="input-suffix">%</span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label font-bold text-primary" for="maestroPrecioVenta">Precio Venta (Gs.) *</label>
                <input
                  id="maestroPrecioVenta"
                  type="number"
                  step="500"
                  class="form-control font-bold text-primary highlight-input"
                  placeholder="Ej. 12000"
                  [(ngModel)]="productoMaestroForm.precioVenta"
                  (ngModelChange)="onPrecioVentaChange()"
                />
              </div>
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label d-flex align-center gap-1" for="maestroCodBarra">
                <app-icon name="barcode" [size]="14" />
                <span>Código de Barra</span>
              </label>
              <input
                id="maestroCodBarra"
                type="text"
                class="form-control"
                [(ngModel)]="productoMaestroForm.codigoBarra"
                placeholder="Escanea o escribe el código de barra..."
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="maestroSku">Código SKU / Referencia Interna</label>
              <input
                id="maestroSku"
                type="text"
                class="form-control"
                [(ngModel)]="productoMaestroForm.sku"
                placeholder="Ej. H-4, POT-1KG, P-1..."
              />
            </div>
          </div>

          <div class="form-row-3">
            <div class="form-group">
              <label class="form-label" for="maestroStock">Stock Actual *</label>
              <input
                id="maestroStock"
                type="number"
                step="0.1"
                class="form-control"
                [(ngModel)]="productoMaestroForm.stock"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="maestroStockMin">Stock Mínimo *</label>
              <input
                id="maestroStockMin"
                type="number"
                step="0.1"
                class="form-control"
                [(ngModel)]="productoMaestroForm.stockMinimo"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="maestroIva">Tasa de IVA *</label>
              <select id="maestroIva" class="form-control" [(ngModel)]="productoMaestroForm.tipoIva">
                @for (opc of opcionesIva; track opc.valor) {
                  <option [value]="opc.valor">{{ opc.label }}</option>
                }
              </select>
            </div>
          </div>

          <!-- ATRIBUTOS ESPECÍFICOS SEGÚN TIPO -->
          @if (productoMaestroForm.tipoArticulo === 'ENVASE') {
            <div class="specific-attributes-box">
              <h4 class="attributes-title">Propiedades del Envase / Pote</h4>
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label" for="maestroMaxSabores">Máx. Sabores Permitidos *</label>
                  <input
                    id="maestroMaxSabores"
                    type="number"
                    min="1"
                    max="8"
                    class="form-control"
                    [(ngModel)]="productoMaestroForm.maxSabores"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label" for="maestroPesoGramos">Peso Aprox. en Gramos</label>
                  <input
                    id="maestroPesoGramos"
                    type="number"
                    class="form-control"
                    [(ngModel)]="productoMaestroForm.pesoGramosAprox"
                  />
                </div>
              </div>
            </div>
          }

          @if (productoMaestroForm.tipoArticulo === 'SABOR') {
            <div class="specific-attributes-box">
              <h4 class="attributes-title">Propiedades y Dietario del Sabor</h4>
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label" for="maestroCatSabor">Categoría del Sabor</label>
                  <select id="maestroCatSabor" class="form-control" [(ngModel)]="productoMaestroForm.categoriaSabor">
                    <option value="CREMA">CREMA</option>
                    <option value="CHOCOLATE">CHOCOLATE</option>
                    <option value="DULCE_DE_LECHE">DULCE_DE_LECHE</option>
                    <option value="FRUTAL">FRUTAL</option>
                    <option value="ESPECIAL">ESPECIAL</option>
                    @for (c of categoriasService.categoriasSabores(); track c.id) {
                      @if (!['CREMA', 'CHOCOLATE', 'DULCE_DE_LECHE', 'FRUTAL', 'ESPECIAL'].includes(c.nombre)) {
                        <option [value]="c.nombre">{{ c.nombre }}</option>
                      }
                    }
                  </select>
                </div>
                <div class="checkboxes-row mt-4">
                  <label class="checkbox-label">
                    <input type="checkbox" [(ngModel)]="productoMaestroForm.aptoCeliaco" />
                    <span>🌾 Sin TACC</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" [(ngModel)]="productoMaestroForm.esVegano" />
                    <span>🌱 Vegano</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" [(ngModel)]="productoMaestroForm.sinAzucar" />
                    <span>🍃 Sin Azúcar</span>
                  </label>
                </div>
              </div>
            </div>
          }

          <!-- SECCIÓN PROVEEDORES VINCULADOS (N:M MULTI-PROVEEDOR) -->
          <div class="suppliers-management-card">
            <div class="suppliers-card-header">
              <div class="d-flex align-center gap-2">
                <app-icon name="truck" [size]="18" />
                <h4 class="m-0">Proveedores Vinculados (Multi-Proveedor N:M)</h4>
              </div>
              <span class="text-xs text-muted">
                {{ productoMaestroForm.proveedoresList.length }} proveedor(es) asignado(s)
              </span>
            </div>

            <!-- Tabla de Proveedores Asignados -->
            @if (productoMaestroForm.proveedoresList.length > 0) {
              <div class="table-responsive mb-3">
                <table class="table-sm table-custom">
                  <thead>
                    <tr>
                      <th>Proveedor</th>
                      <th>Cód. Referencia</th>
                      <th>Costo Compra (Gs.)</th>
                      <th class="text-center">Principal</th>
                      <th class="text-right">Quitar</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of productoMaestroForm.proveedoresList; track item.proveedorId; let idx = $index) {
                      <tr>
                        <td>
                          <strong>{{ item.razonSocial }}</strong>
                          @if (item.ruc) {
                            <span class="text-muted text-xs ms-1">({{ item.ruc }})</span>
                          }
                        </td>
                        <td>
                          <input
                            type="text"
                            class="form-control form-control-sm"
                            [(ngModel)]="item.codigoReferencia"
                            placeholder="Ref. proveedor..."
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="500"
                            class="form-control form-control-sm font-bold"
                            [(ngModel)]="item.costoCompra"
                            placeholder="0"
                          />
                        </td>
                        <td class="text-center">
                          <button
                            type="button"
                            class="btn-star"
                            [class.btn-star-active]="item.esPrincipal"
                            (click)="marcarComoPrincipal(idx)"
                            [title]="item.esPrincipal ? 'Proveedor Principal' : 'Hacer proveedor principal'"
                          >
                            <span>{{ item.esPrincipal ? '⭐ Principal' : '☆ Alternativo' }}</span>
                          </button>
                        </td>
                        <td class="text-right">
                          <button
                            type="button"
                            class="btn-icon-danger"
                            (click)="quitarProveedorDelFormulario(idx)"
                            title="Desvincular proveedor"
                          >
                            <app-icon name="trash" [size]="14" />
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <div class="empty-suppliers-hint">
                <p class="text-muted text-xs m-0">No hay proveedores asignados. Puedes vincular uno o más proveedores a continuación.</p>
              </div>
            }

            <!-- Fila para agregar nuevo proveedor -->
            <div class="add-supplier-row">
              <div class="form-group flex-2">
                <label class="form-label text-xs">Vincular Proveedor</label>
                <select class="form-control form-control-sm" [(ngModel)]="nuevoVinculoProveedorId">
                  <option [ngValue]="null">-- Seleccionar Proveedor --</option>
                  @for (pr of proveedoresDisponiblesParaAgregar(); track pr.id) {
                    <option [ngValue]="pr.id">{{ pr.razonSocial }} ({{ pr.ruc }})</option>
                  }
                </select>
              </div>
              <div class="form-group flex-1">
                <label class="form-label text-xs">Costo Compra (Gs.)</label>
                <input
                  type="number"
                  step="500"
                  class="form-control form-control-sm"
                  [(ngModel)]="nuevoVinculoCosto"
                  placeholder="Ej. 12000"
                />
              </div>
              <div class="form-group flex-1">
                <label class="form-label text-xs">Cód. Referencia</label>
                <input
                  type="text"
                  class="form-control form-control-sm"
                  [(ngModel)]="nuevoVinculoRef"
                  placeholder="Ej. REF-01"
                />
              </div>
              <div class="form-group flex-auto d-flex align-end">
                <button
                  type="button"
                  class="btn btn-sm btn-secondary"
                  (click)="agregarProveedorAlFormulario()"
                  [disabled]="!nuevoVinculoProveedorId"
                >
                  <app-icon name="plus" [size]="14" />
                  <span>Vincular</span>
                </button>
              </div>
            </div>
          </div>

          <div class="form-group mt-3">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="productoMaestroForm.activo" />
              <span>✅ Artículo Activo para compras y ventas</span>
            </label>
          </div>
        </div>

        <div footer>
          <button type="button" class="btn btn-secondary" (click)="modalMaestroAbierto.set(false)">Cancelar</button>
          <button type="button" class="btn btn-primary" (click)="guardarProductoMaestro()" [disabled]="guardandoItem()">
            @if (guardandoItem()) {
              <app-icon name="refresh" [size]="16" extraClass="spin-icon" />
              <span>Guardando...</span>
            } @else {
              <app-icon name="check" [size]="16" />
              <span>{{ productoMaestroEditando?.id ? 'Guardar Cambios' : 'Crear Artículo ERP' }}</span>
            }
          </button>
        </div>
      </app-modal>

      <!-- MODAL CATEGORÍA -->
      <app-modal
        [isOpen]="modalCategoriaAbierto()"
        [title]="categoriaEditando?.id ? ('Modificar Categoría: ' + categoriaEditando?.nombre) : 'Nueva Categoría / Familia'"
        size="md"
        (close)="modalCategoriaAbierto.set(false)"
      >
        <div body class="form-grid">
          <div class="form-group">
            <label class="form-label" for="catNombre">Nombre de la Categoría *</label>
            <input
              id="catNombre"
              type="text"
              class="form-control"
              [(ngModel)]="categoriaForm.nombre"
              placeholder="Ej. Cafés Especiales, Helados Gourmet, Descartables..."
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="catTipoArticulo">Tipo de Artículo Aplicable</label>
            <select id="catTipoArticulo" class="form-control" [(ngModel)]="categoriaForm.tipoArticulo">
              <option [ngValue]="null">General / Aplica a cualquier artículo</option>
              <option value="SABOR">Sabor de Helado</option>
              <option value="VENTA_DIRECTA">Venta Directa / Cafetería Envasada</option>
              <option value="ENVASE">Envase / Pote de Helado</option>
              <option value="TOPPING">Topping / Agregado</option>
              <option value="INSUMO">Insumo / Materia Prima</option>
            </select>
            <span class="small text-muted mt-1">Si seleccionas un tipo, esta categoría se sugerirá específicamente al crear artículos de esa clase.</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="catDesc">Descripción / Notas</label>
            <textarea
              id="catDesc"
              class="form-control"
              rows="3"
              [(ngModel)]="categoriaForm.descripcion"
              placeholder="Descripción opcional de la categoría..."
            ></textarea>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="categoriaForm.activo" />
              <span>✅ Categoría Activa (disponible en selección de artículos)</span>
            </label>
          </div>
        </div>

        <div footer>
          <button type="button" class="btn btn-secondary" (click)="modalCategoriaAbierto.set(false)">Cancelar</button>
          <button
            type="button"
            class="btn btn-primary"
            [disabled]="guardandoCategoria() || !categoriaForm.nombre.trim()"
            (click)="guardarCategoria()"
          >
            @if (guardandoCategoria()) {
              <app-icon name="refresh" [size]="16" extraClass="spin-icon" />
              <span>Guardando...</span>
            } @else {
              <app-icon name="check" [size]="16" />
              <span>{{ categoriaEditando?.id ? 'Guardar Cambios' : 'Crear Categoría' }}</span>
            }
          </button>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    .catalogos-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .page-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-main);
    }
    .page-subtitle {
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .tabs-nav {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 0.85rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background: var(--bg-surface);
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.15s;
    }
    .tab-btn:hover {
      background: var(--bg-subtle);
      color: var(--text-main);
    }
    .tab-btn.active {
      background: #0f172a;
      border-color: #0f172a;
      color: #ffffff;
    }
    .actions-cell {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.4rem;
    }
    .btn-icon-danger {
      background: none;
      border: none;
      color: var(--color-danger);
      cursor: pointer;
      padding: 0.35rem;
      border-radius: 4px;
      transition: background 0.15s;
    }
    .btn-icon-danger:hover { background: #fee2e2; }
    .cursor-pointer { cursor: pointer; border: none; }
    .form-grid { display: flex; flex-direction: column; gap: 1rem; }
    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .checkboxes-row {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      background: var(--bg-subtle);
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
    }
    .checkbox-label {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8125rem;
      cursor: pointer;
      font-weight: 500;
    }
    .category-chip {
      background: var(--bg-subtle);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .text-primary { color: var(--primary); }
    .text-danger { color: var(--color-danger); }
    .font-bold { font-weight: 700; }
    .text-sm { font-size: 0.78rem; }
    .text-right { text-align: right; }
    .d-flex { display: flex; }
    .align-center { align-items: center; }
    .gap-1 { gap: 0.25rem; }
    .flex-wrap { flex-wrap: wrap; }
    .mt-4 { margin-top: 1rem; }
    .badge-iva-10 { background: #e0f2fe; color: #0369a1; font-weight: 600; }
    .badge-iva-5 { background: #fef9c3; color: #854d0e; font-weight: 600; }
    .badge-iva-exenta { background: #f1f5f9; color: #475569; font-weight: 600; }
    .code-badge-inline {
      display: inline-flex;
      align-items: center;
      padding: 0.15rem 0.45rem;
      border-radius: 0.25rem;
      background: #e0f2fe;
      color: #0369a1;
      font-family: monospace;
      font-weight: 700;
      font-size: 0.72rem;
      border: 1px solid #bae6fd;
      line-height: 1.2;
    }
    .barcode-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.2rem 0.5rem;
      border-radius: 0.375rem;
      background: #f1f5f9;
      color: #334155;
      font-family: monospace;
      font-weight: 700;
      font-size: 0.75rem;
      border: 1px solid #e2e8f0;
    }
    .supplier-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.8125rem;
      color: var(--text-main, #334155);
      font-weight: 500;
    }
    .cursor-pointer {
      cursor: pointer;
    }
    .table-filters {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .filter-provider-box {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: var(--surface, #ffffff);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-md, 0.375rem);
      border: 1px solid var(--border-color, #cbd5e1);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    .filter-label {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted, #64748b);
      white-space: nowrap;
    }
    .select-provider-filter {
      border: none;
      background: transparent;
      font-weight: 600;
      font-size: 0.8125rem;
      color: var(--text-main, #1e293b);
      padding: 0.2rem 0.4rem;
      outline: none;
      cursor: pointer;
    }
    .select-provider-filter:focus {
      outline: none;
    }
    .section-subtitle {
      font-size: 0.8125rem;
      color: var(--text-muted, #64748b);
      margin: 0.2rem 0 0 0;
    }
    .empty-filter-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-muted, #64748b);
      padding: 1.5rem;
    }
    .btn-ghost {
      background: transparent;
      border: none;
      padding: 0.35rem 0.6rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8125rem;
      border-radius: var(--radius-sm, 0.25rem);
    }
    .btn-ghost:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    /* ESTILOS CATÁLOGO MAESTRO ERP */
    .search-box-sm {
      position: relative;
      display: flex;
      align-items: center;
      min-width: 240px;
    }
    .search-icon-sm {
      position: absolute;
      left: 0.6rem;
      color: var(--text-muted, #94a3b8);
      pointer-events: none;
    }
    .search-input-sm {
      width: 100%;
      padding: 0.35rem 1.8rem 0.35rem 2rem;
      border-radius: var(--radius-md, 0.375rem);
      border: 1px solid var(--border-color, #cbd5e1);
      font-size: 0.8125rem;
      background: var(--bg-main, #f8fafc);
      color: var(--text-main, #0f172a);
      outline: none;
    }
    .search-input-sm:focus {
      border-color: var(--primary, #0284c7);
      background: #ffffff;
    }
    .btn-clear-sm {
      position: absolute;
      right: 0.5rem;
      background: none;
      border: none;
      color: var(--text-muted, #94a3b8);
      cursor: pointer;
      padding: 0;
    }
    .suppliers-pill-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      max-width: 280px;
    }
    .supplier-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background: #f1f5f9;
      color: #334155;
      padding: 0.15rem 0.45rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      border: 1px solid #e2e8f0;
      cursor: pointer;
      transition: all 0.15s;
    }
    .supplier-pill:hover {
      border-color: var(--primary, #0284c7);
      background: #e0f2fe;
    }
    .supplier-pill-principal {
      background: #fef3c7;
      border-color: #fde68a;
      color: #92400e;
      font-weight: 600;
    }
    .cost-tag {
      background: rgba(0, 0, 0, 0.06);
      padding: 0.05rem 0.3rem;
      border-radius: 4px;
      font-size: 0.6875rem;
    }
    .star-icon {
      font-size: 0.75rem;
      line-height: 1;
    }
    .badge-tipo-directa { background: #e0f2fe; color: #0369a1; }
    .badge-tipo-envase { background: #fce7f3; color: #be185d; }
    .badge-tipo-sabor { background: #fef08a; color: #854d0e; }
    .badge-tipo-topping { background: #ede9fe; color: #6d28d9; }
    .badge-tipo-insumo { background: #dcfce7; color: #15803d; }
    .badge-tipo-default { background: #f1f5f9; color: #475569; }
    .font-mono { font-family: monospace; }
    .specific-attributes-box {
      background: #f8fafc;
      padding: 0.875rem;
      border-radius: 0.5rem;
      border: 1px dashed #cbd5e1;
    }
    .attributes-title {
      font-size: 0.8125rem;
      font-weight: 700;
      color: #475569;
      margin: 0 0 0.5rem 0;
    }
    .suppliers-management-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 0.875rem;
    }
    .suppliers-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .suppliers-card-header h4 {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-main, #0f172a);
    }
    .empty-suppliers-hint {
      padding: 0.75rem;
      text-align: center;
      background: #ffffff;
      border-radius: 0.375rem;
      border: 1px dashed #cbd5e1;
      margin-bottom: 0.75rem;
    }
    .add-supplier-row {
      display: flex;
      gap: 0.5rem;
      align-items: flex-end;
      background: #ffffff;
      padding: 0.625rem;
      border-radius: 0.375rem;
      border: 1px solid #e2e8f0;
      flex-wrap: wrap;
    }
    .form-row-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 1rem;
    }
    @media (max-width: 600px) {
      .form-row-3 {
        grid-template-columns: 1fr;
      }
    }
    .flex-1 { flex: 1; min-width: 130px; }
    .flex-2 { flex: 2; min-width: 180px; }
    .flex-auto { flex: 0 0 auto; }
    .align-end { align-self: flex-end; }
    .btn-star {
      background: none;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 0.2rem 0.4rem;
      font-size: 0.6875rem;
      cursor: pointer;
      color: #64748b;
    }
    .btn-star-active {
      background: #fef3c7;
      border-color: #fde68a;
      color: #b45309;
      font-weight: 700;
    }

    /* ESTILOS CALCULADORA DE PRECIO Y MARGEN */
    .pricing-calculator-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      padding: 0.875rem;
    }
    .pricing-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .pricing-card-title {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--text-main, #0f172a);
    }
    .profit-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .profit-positive {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }
    .profit-negative {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }
    .form-row-4 {
      display: grid;
      grid-template-columns: 1fr 1fr 1.1fr 1.2fr;
      gap: 0.875rem;
    }
    @media (max-width: 768px) {
      .form-row-4 {
        grid-template-columns: 1fr 1fr;
      }
    }
    @media (max-width: 480px) {
      .form-row-4 {
        grid-template-columns: 1fr;
      }
    }
    .quick-margins {
      display: flex;
      gap: 0.25rem;
    }
    .btn-margin-chip {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      font-size: 0.6875rem;
      padding: 0.1rem 0.35rem;
      cursor: pointer;
      color: #475569;
      font-weight: 600;
      transition: all 0.1s;
    }
    .btn-margin-chip:hover {
      background: #e0f2fe;
      border-color: #0284c7;
      color: #0284c7;
    }
    .active-margin {
      background: #0284c7 !important;
      border-color: #0284c7 !important;
      color: #ffffff !important;
    }
    .input-with-suffix {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-suffix {
      position: absolute;
      right: 0.75rem;
      color: var(--text-muted, #94a3b8);
      font-weight: 700;
      font-size: 0.875rem;
      pointer-events: none;
    }
    .highlight-input {
      background: #f0fdf4 !important;
      border-color: #86efac !important;
      font-size: 1rem !important;
    }
    .highlight-input:focus {
      border-color: #22c55e !important;
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2) !important;
    }
    .justify-content-between { justify-content: space-between; }
    .mb-1 { margin-bottom: 0.25rem; }
    .m-0 { margin: 0; }
  `]
})
export class CatalogosComponent implements OnInit {
  public readonly authService = inject(AuthService);
  public readonly catalogosService = inject(CatalogosService);
  public readonly productosService = inject(ProductosService);
  public readonly proveedoresService = inject(ProveedoresService);
  public readonly categoriasService = inject(CategoriasService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  public readonly opcionesIva = OPCIONES_TIPO_IVA;

  public readonly tabActiva = signal<'maestro' | 'sabores' | 'presentaciones' | 'toppings' | 'productos' | 'categorias'>('maestro');
  public readonly guardandoItem = signal<boolean>(false);

  esTabPermitida(tab: string): boolean {
    switch (tab) {
      case 'maestro':
        return this.authService.hasPermission('productos');
      case 'sabores':
        return this.authService.hasPermission('sabores');
      case 'presentaciones':
        return this.authService.hasPermission('presentaciones');
      case 'toppings':
        return this.authService.hasPermission('toppings');
      case 'productos':
        return this.authService.hasPermission('productos');
      case 'categorias':
        return this.authService.hasPermission('categorias');
      default:
        return false;
    }
  }

  obtenerPrimerTabPermitida(): 'maestro' | 'sabores' | 'presentaciones' | 'toppings' | 'productos' | 'categorias' {
    const tabs: ('maestro' | 'sabores' | 'presentaciones' | 'toppings' | 'productos' | 'categorias')[] = [
      'maestro', 'sabores', 'presentaciones', 'toppings', 'productos', 'categorias'
    ];
    for (const t of tabs) {
      if (this.esTabPermitida(t)) {
        return t;
      }
    }
    return 'maestro';
  }

  // Filtros y Estado Categorías
  public readonly filtroCategoriaBuscar = signal<string>('');
  public readonly filtroCategoriaTipo = signal<string>('TODOS');
  public readonly modalCategoriaAbierto = signal<boolean>(false);
  public readonly guardandoCategoria = signal<boolean>(false);
  public categoriaEditando: Categoria | null = null;
  public categoriaForm: CategoriaRequest = {
    nombre: '',
    descripcion: '',
    tipoArticulo: null,
    activo: true
  };

  public readonly categoriasFiltradas = computed(() => {
    let list = this.categoriasService.categorias();
    const buscar = this.filtroCategoriaBuscar().trim().toLowerCase();
    const tipo = this.filtroCategoriaTipo();

    if (tipo === 'GENERAL') {
      list = list.filter(c => !c.tipoArticulo);
    } else if (tipo !== 'TODOS') {
      list = list.filter(c => c.tipoArticulo === tipo);
    }

    if (buscar) {
      list = list.filter(c =>
        c.nombre.toLowerCase().includes(buscar) ||
        (c.descripcion && c.descripcion.toLowerCase().includes(buscar))
      );
    }

    return list;
  });

  categoriasPorTipo(tipo?: TipoArticulo): Categoria[] {
    const cats = this.categoriasService.categorias().filter(c => c.activo);
    if (!tipo) return cats;
    return cats.filter(c => !c.tipoArticulo || c.tipoArticulo === tipo);
  }

  // Filtros Maestro ERP
  public readonly filtroMaestroBuscar = signal<string>('');
  public readonly filtroMaestroTipo = signal<string>('TODOS');
  public readonly filtroMaestroProveedorId = signal<string>('TODOS');
  public readonly filtroMaestroSoloActivos = signal<boolean>(false);
  public readonly modalMaestroAbierto = signal<boolean>(false);

  public productoMaestroEditando: Producto | null = null;
  public productoMaestroForm: ProductoMaestroFormModel = this.getProductoMaestroFormInicial();

  public nuevoVinculoProveedorId: number | null = null;
  public nuevoVinculoCosto: number | null = null;
  public nuevoVinculoRef: string = '';
  public nuevoVinculoEsPrincipal: boolean = false;

  public readonly productosMaestrosFiltrados = computed(() => {
    let list = this.productosService.productos();
    const buscar = this.filtroMaestroBuscar().trim().toLowerCase();
    const tipo = this.filtroMaestroTipo();
    const provFiltro = this.filtroMaestroProveedorId();
    const soloActivos = this.filtroMaestroSoloActivos();

    if (soloActivos) {
      list = list.filter(p => p.activo);
    }
    if (tipo !== 'TODOS') {
      list = list.filter(p => p.tipoArticulo === tipo);
    }
    if (provFiltro === 'SIN_PROVEEDOR') {
      list = list.filter(p => !p.proveedores || p.proveedores.length === 0);
    } else if (provFiltro !== 'TODOS') {
      const provId = Number(provFiltro);
      list = list.filter(p => p.proveedores && p.proveedores.some(pv => pv.proveedorId === provId));
    }
    if (buscar) {
      list = list.filter(p =>
        p.nombre.toLowerCase().includes(buscar) ||
        (p.codigoBarra && p.codigoBarra.toLowerCase().includes(buscar)) ||
        (p.sku && p.sku.toLowerCase().includes(buscar)) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(buscar))
      );
    }
    return list;
  });

  public readonly proveedoresDisponiblesParaAgregar = computed(() => {
    const asignadosIds = new Set(this.productoMaestroForm.proveedoresList.map(p => p.proveedorId));
    return this.proveedoresService.proveedores().filter(pr => !asignadosIds.has(pr.id));
  });

  // Filtro de Proveedor para pestaña Productos
  public readonly filtroProveedorId = signal<string>('TODOS');

  public readonly productosFiltrados = computed(() => {
    const prods = this.catalogosService.productosSimples();
    const filtro = this.filtroProveedorId();

    if (filtro === 'TODOS') {
      return prods;
    }
    if (filtro === 'SIN_PROVEEDOR') {
      return prods.filter(p => !p.proveedor && !p.proveedorId);
    }
    const numId = Number(filtro);
    return prods.filter(p => p.proveedor?.id === numId || p.proveedorId === numId);
  });

  // Modales
  public readonly modalSaborAbierto = signal<boolean>(false);
  public readonly modalPresentacionAbierto = signal<boolean>(false);
  public readonly modalToppingAbierto = signal<boolean>(false);
  public readonly modalProductoAbierto = signal<boolean>(false);

  // Forms
  public saborEditando: Partial<Sabor> | null = null;
  public saborForm: Partial<Sabor> = this.getSaborFormInicial();

  public presentacionEditando: Partial<Presentacion> | null = null;
  public presentacionForm: Partial<Presentacion> = this.getPresentacionFormInicial();

  public toppingEditando: Partial<Topping> | null = null;
  public toppingForm: Partial<Topping> = this.getToppingFormInicial();

  public productoEditando: Partial<ProductoSimple> | null = null;
  public productoForm: Partial<ProductoSimple> = this.getProductoFormInicial();

  ngOnInit(): void {
    if (!this.esTabPermitida(this.tabActiva())) {
      this.tabActiva.set(this.obtenerPrimerTabPermitida());
    }

    this.route.params.subscribe(params => {
      const seccion = params['seccion'];
      if (seccion && ['maestro', 'sabores', 'presentaciones', 'toppings', 'productos', 'categorias'].includes(seccion) && this.esTabPermitida(seccion)) {
        this.tabActiva.set(seccion as any);
      }
    });

    this.route.queryParams.subscribe(qp => {
      if (qp['proveedorId']) {
        const provIdStr = String(qp['proveedorId']);
        this.filtroProveedorId.set(provIdStr);
        this.filtroMaestroProveedorId.set(provIdStr);
        if (this.esTabPermitida('maestro')) {
          this.tabActiva.set('maestro');
        }
      }
      if (qp['tab'] && ['maestro', 'sabores', 'presentaciones', 'toppings', 'productos', 'categorias'].includes(qp['tab']) && this.esTabPermitida(qp['tab'])) {
        this.tabActiva.set(qp['tab']);
      }
      if (qp['accion'] === 'crear' && this.authService.hasPermission('productos')) {
        const provId = qp['proveedorId'] ? Number(qp['proveedorId']) : null;
        this.abrirModalMaestroCrear(provId);
      }
    });

    this.productosService.cargarProductos();
    this.catalogosService.cargarSabores();
    this.catalogosService.cargarPresentaciones();
    this.catalogosService.cargarToppings();
    this.catalogosService.cargarProductosSimples();
    this.proveedoresService.cargarProveedores();
    this.categoriasService.cargarCategorias();
  }

  contarProductosPorProveedor(proveedorId: number): number {
    return this.catalogosService.productosSimples()
      .filter(p => p.proveedor?.id === proveedorId || p.proveedorId === proveedorId)
      .length;
  }

  contarProductosSinProveedor(): number {
    return this.catalogosService.productosSimples()
      .filter(p => !p.proveedor && !p.proveedorId)
      .length;
  }

  // Sabor CRUD
  private getSaborFormInicial(): Partial<Sabor> {
    return {
      nombre: '',
      descripcion: '',
      categoria: 'CREMA',
      stockKilos: 10.0,
      stockMinimoKilos: 2.0,
      aptoCeliaco: true,
      esVegano: false,
      sinAzucar: false,
      disponible: true
    };
  }

  abrirModalSabor(sab?: Sabor): void {
    if (sab) {
      this.saborEditando = sab;
      this.saborForm = { ...sab };
    } else {
      this.saborEditando = null;
      this.saborForm = this.getSaborFormInicial();
    }
    this.modalSaborAbierto.set(true);
  }

  guardarSabor(): void {
    if (!this.saborForm.nombre?.trim()) {
      this.toast.warning('Ingresa el nombre del sabor.');
      return;
    }
    this.guardandoItem.set(true);
    const op$ = this.saborEditando?.id
      ? this.catalogosService.actualizarSabor(this.saborEditando.id, this.saborForm)
      : this.catalogosService.crearSabor(this.saborForm);

    op$.subscribe({
      next: () => {
        this.guardandoItem.set(false);
        this.modalSaborAbierto.set(false);
        this.productosService.cargarProductos();
      },
      error: (err) => {
        this.guardandoItem.set(false);
        this.toast.error(err.error?.mensaje || 'Error al guardar sabor.');
      }
    });
  }

  toggleDisponibilidadSabor(sab: Sabor): void {
    if (!sab.id) return;
    this.catalogosService.toggleDisponibilidadSabor(sab.id, !sab.disponible).subscribe({
      next: () => this.productosService.cargarProductos()
    });
  }

  confirmarEliminarSabor(sab: Sabor): void {
    if (!sab.id) return;
    if (confirm(`¿Eliminar sabor "${sab.nombre}"?`)) {
      this.catalogosService.eliminarSabor(sab.id).subscribe({
        next: () => this.productosService.cargarProductos()
      });
    }
  }

  // Presentación CRUD
  private getPresentacionFormInicial(): Partial<Presentacion> {
    return {
      nombre: '',
      precio: 15000,
      maxSabores: 2,
      pesoGramosAprox: 200,
      stock: 50,
      stockMinimo: 10,
      activo: true,
      tipoIva: 'IVA_10'
    };
  }

  abrirModalPresentacion(pres?: Presentacion): void {
    if (pres) {
      this.presentacionEditando = pres;
      this.presentacionForm = {
        ...pres,
        tipoIva: pres.tipoIva || 'IVA_10'
      };
    } else {
      this.presentacionEditando = null;
      this.presentacionForm = this.getPresentacionFormInicial();
    }
    this.modalPresentacionAbierto.set(true);
  }

  guardarPresentacion(): void {
    if (!this.presentacionForm.nombre?.trim() || !this.presentacionForm.precio) {
      this.toast.warning('Completa nombre y precio del envase.');
      return;
    }
    this.guardandoItem.set(true);
    const op$ = this.presentacionEditando?.id
      ? this.catalogosService.actualizarPresentacion(this.presentacionEditando.id, this.presentacionForm)
      : this.catalogosService.crearPresentacion(this.presentacionForm);

    op$.subscribe({
      next: () => {
        this.guardandoItem.set(false);
        this.modalPresentacionAbierto.set(false);
        this.productosService.cargarProductos();
      },
      error: (err) => {
        this.guardandoItem.set(false);
        this.toast.error(err.error?.mensaje || 'Error al guardar envase.');
      }
    });
  }

  confirmarEliminarPresentacion(pres: Presentacion): void {
    if (!pres.id) return;
    if (confirm(`¿Eliminar presentación "${pres.nombre}"?`)) {
      this.catalogosService.eliminarPresentacion(pres.id).subscribe({
        next: () => this.productosService.cargarProductos()
      });
    }
  }

  // Topping CRUD
  private getToppingFormInicial(): Partial<Topping> {
    return {
      nombre: '',
      precioExtra: 3000,
      disponible: true
    };
  }

  abrirModalTopping(top?: Topping): void {
    if (top) {
      this.toppingEditando = top;
      this.toppingForm = { ...top };
    } else {
      this.toppingEditando = null;
      this.toppingForm = this.getToppingFormInicial();
    }
    this.modalToppingAbierto.set(true);
  }

  guardarTopping(): void {
    if (!this.toppingForm.nombre?.trim() || this.toppingForm.precioExtra === undefined) {
      this.toast.warning('Completa nombre y precio extra del topping.');
      return;
    }
    this.guardandoItem.set(true);
    const op$ = this.toppingEditando?.id
      ? this.catalogosService.actualizarTopping(this.toppingEditando.id, this.toppingForm)
      : this.catalogosService.crearTopping(this.toppingForm);

    op$.subscribe({
      next: () => {
        this.guardandoItem.set(false);
        this.modalToppingAbierto.set(false);
        this.productosService.cargarProductos();
      },
      error: (err) => {
        this.guardandoItem.set(false);
        this.toast.error(err.error?.mensaje || 'Error al guardar topping.');
      }
    });
  }

  toggleDisponibilidadTopping(top: Topping): void {
    if (!top.id) return;
    this.catalogosService.toggleDisponibilidadTopping(top.id, !top.disponible).subscribe({
      next: () => this.productosService.cargarProductos()
    });
  }

  confirmarEliminarTopping(top: Topping): void {
    if (!top.id) return;
    if (confirm(`¿Eliminar topping "${top.nombre}"?`)) {
      this.catalogosService.eliminarTopping(top.id).subscribe({
        next: () => this.productosService.cargarProductos()
      });
    }
  }

  // Producto Simple CRUD
  private getProductoFormInicial(): Partial<ProductoSimple> {
    return {
      nombre: '',
      precio: 10000,
      categoria: 'BEBIDAS',
      stock: 30,
      stockMinimo: 5,
      activo: true,
      tipoIva: 'IVA_10',
      codigo: '',
      codigoBarra: '',
      proveedorId: null
    };
  }

  abrirModalProducto(prod?: ProductoSimple): void {
    if (prod) {
      this.productoEditando = prod;
      this.productoForm = {
        ...prod,
        tipoIva: prod.tipoIva || 'IVA_10',
        codigo: prod.codigo || '',
        codigoBarra: prod.codigoBarra || '',
        proveedorId: prod.proveedor?.id || prod.proveedorId || null
      };
    } else {
      this.productoEditando = null;
      this.productoForm = this.getProductoFormInicial();
    }
    this.modalProductoAbierto.set(true);
  }

  guardarProducto(): void {
    if (!this.productoForm.nombre?.trim() || !this.productoForm.precio) {
      this.toast.warning('Completa nombre y precio del producto.');
      return;
    }
    this.guardandoItem.set(true);
    const payload: Partial<ProductoSimple> = {
      ...this.productoForm,
      codigo: this.productoForm.codigo?.trim() || null,
      codigoBarra: this.productoForm.codigoBarra?.trim() || null,
      proveedorId: this.productoForm.proveedorId || null
    };
    const op$ = this.productoEditando?.id
      ? this.catalogosService.actualizarProductoSimple(this.productoEditando.id, payload)
      : this.catalogosService.crearProductoSimple(payload);

    op$.subscribe({
      next: () => {
        this.guardandoItem.set(false);
        this.modalProductoAbierto.set(false);
        this.productosService.cargarProductos();
      },
      error: (err) => {
        this.guardandoItem.set(false);
        this.toast.error(err.error?.mensaje || 'Error al guardar producto.');
      }
    });
  }

  confirmarEliminarProducto(prod: ProductoSimple): void {
    if (!prod.id) return;
    if (confirm(`¿Eliminar producto "${prod.nombre}"?`)) {
      this.catalogosService.eliminarProductoSimple(prod.id).subscribe({
        next: () => this.productosService.cargarProductos()
      });
    }
  }

  // Helpers de IVA
  obtenerTextoIva(tipo?: TipoIva): string {
    switch (tipo) {
      case 'IVA_5': return 'IVA 5%';
      case 'EXENTA': return 'Exenta';
      case 'IVA_10':
      default: return 'IVA 10%';
    }
  }

  obtenerClaseBadgeIva(tipo?: TipoIva): string {
    switch (tipo) {
      case 'IVA_5': return 'badge-iva-5';
      case 'EXENTA': return 'badge-iva-exenta';
      case 'IVA_10':
      default: return 'badge-iva-10';
    }
  }

  // --- MÉTODOS CATÁLOGO MAESTRO ERP (MULTI-PROVEEDOR) ---
  private getProductoMaestroFormInicial(): ProductoMaestroFormModel {
    return {
      nombre: '',
      descripcion: '',
      categoria: null,
      tipoArticulo: 'VENTA_DIRECTA',
      unidadMedida: 'UNIDAD',
      codigoBarra: '',
      sku: '',
      precioVenta: 10000,
      precioCosto: 0,
      margenPorcentaje: 20,
      tipoIva: 'IVA_10',
      stock: 20,
      stockMinimo: 5,
      activo: true,
      maxSabores: 2,
      pesoGramosAprox: 200,
      categoriaSabor: 'CREMA',
      aptoCeliaco: true,
      esVegano: false,
      sinAzucar: false,
      proveedoresList: []
    };
  }

  abrirModalMaestroCrear(proveedorIdInicial?: number | null): void {
    this.productoMaestroEditando = null;
    const proveedoresList: AsignarProveedorItem[] = [];
    if (proveedorIdInicial) {
      const p = this.proveedoresService.proveedores().find(pr => pr.id === proveedorIdInicial);
      if (p) {
        proveedoresList.push({
          proveedorId: p.id,
          razonSocial: p.razonSocial,
          ruc: p.ruc,
          codigoReferencia: '',
          costoCompra: 0,
          esPrincipal: true
        });
      }
    }
    this.productoMaestroForm = {
      ...this.getProductoMaestroFormInicial(),
      proveedoresList
    };
    this.nuevoVinculoProveedorId = null;
    this.nuevoVinculoCosto = null;
    this.nuevoVinculoRef = '';
    this.nuevoVinculoEsPrincipal = false;
    this.modalMaestroAbierto.set(true);
  }

  abrirModalMaestroEditar(prod: Producto): void {
    this.productoMaestroEditando = prod;
    const proveedoresList: AsignarProveedorItem[] = (prod.proveedores || []).map(pv => ({
      proveedorId: pv.proveedorId,
      razonSocial: pv.razonSocial,
      ruc: pv.ruc,
      codigoReferencia: pv.codigoReferencia || '',
      costoCompra: pv.costoCompra || 0,
      esPrincipal: pv.esPrincipal
    }));

    const costo = Number(prod.precioCosto) || 0;
    const venta = Number(prod.precioVenta) || 0;
    let margen = 20;
    if (costo > 0 && venta > 0) {
      margen = Math.round(((venta - costo) / costo) * 100 * 10) / 10;
    }

    this.productoMaestroForm = {
      nombre: prod.nombre,
      descripcion: prod.descripcion || '',
      categoria: prod.categoria || null,
      tipoArticulo: prod.tipoArticulo,
      unidadMedida: prod.unidadMedida || 'UNIDAD',
      codigoBarra: prod.codigoBarra || '',
      sku: prod.sku || '',
      precioVenta: prod.precioVenta,
      precioCosto: prod.precioCosto || 0,
      margenPorcentaje: margen,
      tipoIva: prod.tipoIva || 'IVA_10',
      stock: prod.stock,
      stockMinimo: prod.stockMinimo,
      activo: prod.activo,
      maxSabores: prod.maxSabores || 2,
      pesoGramosAprox: prod.pesoGramosAprox || 200,
      categoriaSabor: prod.categoriaSabor || 'CREMA',
      aptoCeliaco: prod.aptoCeliaco ?? true,
      esVegano: prod.esVegano ?? false,
      sinAzucar: prod.sinAzucar ?? false,
      proveedoresList
    };
    this.nuevoVinculoProveedorId = null;
    this.nuevoVinculoCosto = null;
    this.nuevoVinculoRef = '';
    this.nuevoVinculoEsPrincipal = false;
    this.modalMaestroAbierto.set(true);
  }

  onCostoOMargenChange(): void {
    const costo = Number(this.productoMaestroForm.precioCosto) || 0;
    const margen = Number(this.productoMaestroForm.margenPorcentaje) || 0;
    if (costo > 0) {
      this.productoMaestroForm.precioVenta = Math.round(costo * (1 + margen / 100));
    }
  }

  onPrecioVentaChange(): void {
    const costo = Number(this.productoMaestroForm.precioCosto) || 0;
    const venta = Number(this.productoMaestroForm.precioVenta) || 0;
    if (costo > 0) {
      const m = ((venta - costo) / costo) * 100;
      this.productoMaestroForm.margenPorcentaje = Math.round(m * 10) / 10;
    }
  }

  aplicarMargenRapido(porcentaje: number): void {
    this.productoMaestroForm.margenPorcentaje = porcentaje;
    this.onCostoOMargenChange();
  }

  calcularGananciaNeta(): number {
    const costo = Number(this.productoMaestroForm.precioCosto) || 0;
    const venta = Number(this.productoMaestroForm.precioVenta) || 0;
    return venta - costo;
  }

  agregarProveedorAlFormulario(): void {
    if (!this.nuevoVinculoProveedorId) {
      this.toast.warning('Selecciona un proveedor para vincular.');
      return;
    }
    const provId = Number(this.nuevoVinculoProveedorId);
    if (this.productoMaestroForm.proveedoresList.some(p => p.proveedorId === provId)) {
      this.toast.warning('Este proveedor ya está en la lista de proveedores del artículo.');
      return;
    }
    const prov = this.proveedoresService.proveedores().find(p => p.id === provId);
    if (!prov) return;

    const esPrincipal = this.nuevoVinculoEsPrincipal || this.productoMaestroForm.proveedoresList.length === 0;

    if (esPrincipal) {
      this.productoMaestroForm.proveedoresList.forEach(p => p.esPrincipal = false);
      if (this.nuevoVinculoCosto && (!this.productoMaestroForm.precioCosto || this.productoMaestroForm.precioCosto === 0)) {
        this.productoMaestroForm.precioCosto = this.nuevoVinculoCosto;
        this.onCostoOMargenChange();
      }
    }

    this.productoMaestroForm.proveedoresList.push({
      proveedorId: prov.id,
      razonSocial: prov.razonSocial,
      ruc: prov.ruc,
      codigoReferencia: this.nuevoVinculoRef?.trim() || null,
      costoCompra: this.nuevoVinculoCosto || null,
      esPrincipal
    });

    this.nuevoVinculoProveedorId = null;
    this.nuevoVinculoCosto = null;
    this.nuevoVinculoRef = '';
    this.nuevoVinculoEsPrincipal = false;
  }

  quitarProveedorDelFormulario(index: number): void {
    const quitado = this.productoMaestroForm.proveedoresList.splice(index, 1)[0];
    if (quitado?.esPrincipal && this.productoMaestroForm.proveedoresList.length > 0) {
      this.productoMaestroForm.proveedoresList[0].esPrincipal = true;
    }
  }

  marcarComoPrincipal(index: number): void {
    this.productoMaestroForm.proveedoresList.forEach((p, idx) => {
      p.esPrincipal = idx === index;
    });
    const provPrincipal = this.productoMaestroForm.proveedoresList[index];
    if (provPrincipal?.costoCompra && (!this.productoMaestroForm.precioCosto || this.productoMaestroForm.precioCosto === 0)) {
      this.productoMaestroForm.precioCosto = provPrincipal.costoCompra;
      this.onCostoOMargenChange();
    }
  }

  guardarProductoMaestro(): void {
    if (!this.productoMaestroForm.nombre?.trim() || this.productoMaestroForm.precioVenta === undefined) {
      this.toast.warning('Completa el nombre y precio de venta del artículo.');
      return;
    }

    this.guardandoItem.set(true);

    const payload: ProductoRequest = {
      nombre: this.productoMaestroForm.nombre.trim(),
      descripcion: this.productoMaestroForm.descripcion?.trim() || null,
      categoria: this.productoMaestroForm.categoria?.trim() || null,
      tipoArticulo: this.productoMaestroForm.tipoArticulo || 'VENTA_DIRECTA',
      unidadMedida: this.productoMaestroForm.unidadMedida || 'UNIDAD',
      codigoBarra: this.productoMaestroForm.codigoBarra?.trim() || null,
      sku: this.productoMaestroForm.sku?.trim() || null,
      precioVenta: this.productoMaestroForm.precioVenta,
      precioCosto: this.productoMaestroForm.precioCosto || null,
      tipoIva: this.productoMaestroForm.tipoIva || 'IVA_10',
      stock: this.productoMaestroForm.stock || 0,
      stockMinimo: this.productoMaestroForm.stockMinimo || 5,
      activo: this.productoMaestroForm.activo ?? true,
      maxSabores: this.productoMaestroForm.tipoArticulo === 'ENVASE' ? this.productoMaestroForm.maxSabores : null,
      pesoGramosAprox: this.productoMaestroForm.tipoArticulo === 'ENVASE' ? this.productoMaestroForm.pesoGramosAprox : null,
      categoriaSabor: this.productoMaestroForm.tipoArticulo === 'SABOR' ? this.productoMaestroForm.categoriaSabor : null,
      aptoCeliaco: this.productoMaestroForm.tipoArticulo === 'SABOR' ? this.productoMaestroForm.aptoCeliaco : false,
      esVegano: this.productoMaestroForm.tipoArticulo === 'SABOR' ? this.productoMaestroForm.esVegano : false,
      sinAzucar: this.productoMaestroForm.tipoArticulo === 'SABOR' ? this.productoMaestroForm.sinAzucar : false,
      proveedores: this.productoMaestroForm.proveedoresList.map(p => ({
        proveedorId: p.proveedorId,
        codigoReferencia: p.codigoReferencia || null,
        costoCompra: p.costoCompra || null,
        esPrincipal: p.esPrincipal
      }))
    };

    const id = this.productoMaestroEditando?.id;
    const op$ = id
      ? this.productosService.actualizar(id, payload)
      : this.productosService.crear(payload);

    op$.subscribe({
      next: () => {
        this.guardandoItem.set(false);
        this.modalMaestroAbierto.set(false);
        this.productosService.cargarProductos();
        this.catalogosService.cargarSabores();
        this.catalogosService.cargarPresentaciones();
        this.catalogosService.cargarToppings();
        this.catalogosService.cargarProductosSimples();
      },
      error: (err) => {
        this.guardandoItem.set(false);
        this.toast.error(err.error?.mensaje || 'Error al guardar artículo en catálogo maestro.');
      }
    });
  }

  confirmarEliminarProductoMaestro(prod: Producto): void {
    if (confirm(`¿Eliminar artículo "${prod.nombre}" del catálogo maestro?`)) {
      this.productosService.eliminar(prod.id).subscribe({
        next: () => {
          this.catalogosService.cargarSabores();
          this.catalogosService.cargarPresentaciones();
          this.catalogosService.cargarToppings();
          this.catalogosService.cargarProductosSimples();
        }
      });
    }
  }

  cambiarEstadoProductoMaestro(prod: Producto): void {
    const nuevoEstado = !prod.activo;
    this.productosService.cambiarEstado(prod.id, nuevoEstado).subscribe({
      next: () => {
        this.catalogosService.cargarSabores();
        this.catalogosService.cargarPresentaciones();
        this.catalogosService.cargarToppings();
        this.catalogosService.cargarProductosSimples();
      }
    });
  }

  limpiarFiltrosMaestro(): void {
    this.filtroMaestroBuscar.set('');
    this.filtroMaestroTipo.set('TODOS');
    this.filtroMaestroProveedorId.set('TODOS');
  }

  obtenerTextoTipoArticulo(tipo?: TipoArticulo): string {
    switch (tipo) {
      case 'VENTA_DIRECTA': return 'Venta Directa';
      case 'ENVASE': return 'Envase';
      case 'SABOR': return 'Sabor';
      case 'TOPPING': return 'Topping';
      case 'INSUMO': return 'Insumo';
      default: return tipo || 'Artículo';
    }
  }

  obtenerClaseTipoArticulo(tipo?: TipoArticulo): string {
    switch (tipo) {
      case 'VENTA_DIRECTA': return 'badge-tipo-directa';
      case 'ENVASE': return 'badge-tipo-envase';
      case 'SABOR': return 'badge-tipo-sabor';
      case 'TOPPING': return 'badge-tipo-topping';
      case 'INSUMO': return 'badge-tipo-insumo';
      default: return 'badge-tipo-default';
    }
  }

  // --- MÉTODOS GESTIÓN DE CATEGORÍAS ---
  abrirModalCategoria(cat?: Categoria): void {
    if (cat) {
      this.categoriaEditando = cat;
      this.categoriaForm = {
        nombre: cat.nombre,
        descripcion: cat.descripcion || '',
        tipoArticulo: cat.tipoArticulo || null,
        activo: cat.activo ?? true
      };
    } else {
      this.categoriaEditando = null;
      this.categoriaForm = {
        nombre: '',
        descripcion: '',
        tipoArticulo: null,
        activo: true
      };
    }
    this.modalCategoriaAbierto.set(true);
  }

  guardarCategoria(): void {
    if (!this.categoriaForm.nombre?.trim()) {
      this.toast.warning('El nombre de la categoría es obligatorio.');
      return;
    }

    this.guardandoCategoria.set(true);
    const req: CategoriaRequest = {
      nombre: this.categoriaForm.nombre.trim(),
      descripcion: this.categoriaForm.descripcion?.trim() || null,
      tipoArticulo: this.categoriaForm.tipoArticulo || null,
      activo: this.categoriaForm.activo ?? true
    };

    const id = this.categoriaEditando?.id;
    const op$ = id
      ? this.categoriasService.actualizar(id, req)
      : this.categoriasService.crear(req);

    op$.subscribe({
      next: () => {
        this.guardandoCategoria.set(false);
        this.modalCategoriaAbierto.set(false);
      },
      error: () => {
        this.guardandoCategoria.set(false);
      }
    });
  }

  toggleEstadoCategoria(cat: Categoria): void {
    const nuevoEstado = !cat.activo;
    this.categoriasService.cambiarEstado(cat.id, nuevoEstado).subscribe();
  }

  confirmarEliminarCategoria(cat: Categoria): void {
    if (confirm(`¿Estás seguro de eliminar la categoría "${cat.nombre}"?`)) {
      this.categoriasService.eliminar(cat.id).subscribe();
    }
  }
}

