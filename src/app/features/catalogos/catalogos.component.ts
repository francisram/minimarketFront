import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CatalogosService } from '../../core/services/catalogos.service';
import { ToastService } from '../../core/services/toast.service';
import { Sabor } from '../../core/models/sabor.model';
import { Presentacion } from '../../core/models/presentacion.model';
import { Topping } from '../../core/models/topping.model';
import { ProductoSimple } from '../../core/models/producto-simple.model';
import { Proveedor } from '../../core/models/proveedor.model';
import { ProveedoresService } from '../../core/services/proveedores.service';
import { TipoIva, OPCIONES_TIPO_IVA } from '../../core/models/tipo-iva.model';
import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { AppModalComponent } from '../../shared/components/modal/modal.component';
import { AppCurrencyPipe } from '../../shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-catalogos',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, AppModalComponent, AppCurrencyPipe],
  template: `
    <div class="catalogos-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Catálogo y Disponibilidad</h1>
          <p class="page-subtitle">Administra el menú de sabores, envases, toppings y cafetería</p>
        </div>

        <div class="header-actions">
          @if (tabActiva() === 'sabores') {
            <button type="button" class="btn btn-primary" (click)="abrirModalSabor()">
              <app-icon name="plus" [size]="16" />
              <span>Nuevo Sabor</span>
            </button>
          } @else if (tabActiva() === 'presentaciones') {
            <button type="button" class="btn btn-primary" (click)="abrirModalPresentacion()">
              <app-icon name="plus" [size]="16" />
              <span>Nuevo Envase</span>
            </button>
          } @else if (tabActiva() === 'toppings') {
            <button type="button" class="btn btn-primary" (click)="abrirModalTopping()">
              <app-icon name="plus" [size]="16" />
              <span>Nuevo Topping</span>
            </button>
          } @else if (tabActiva() === 'productos') {
            <button type="button" class="btn btn-primary" (click)="abrirModalProducto()">
              <app-icon name="plus" [size]="16" />
              <span>Nuevo Producto</span>
            </button>
          }

          <div class="tabs-nav">
            <button 
              type="button" 
              class="tab-btn" 
              [class.active]="tabActiva() === 'sabores'"
              (click)="tabActiva.set('sabores')"
            >
              <app-icon name="ice-cream" [size]="16" />
              <span>Sabores ({{ catalogosService.sabores().length }})</span>
            </button>
            <button 
              type="button" 
              class="tab-btn" 
              [class.active]="tabActiva() === 'presentaciones'"
              (click)="tabActiva.set('presentaciones')"
            >
              <app-icon name="cup-soda" [size]="16" />
              <span>Envases ({{ catalogosService.presentaciones().length }})</span>
            </button>
            <button 
              type="button" 
              class="tab-btn" 
              [class.active]="tabActiva() === 'toppings'"
              (click)="tabActiva.set('toppings')"
            >
              <app-icon name="sparkles" [size]="16" />
              <span>Toppings ({{ catalogosService.toppings().length }})</span>
            </button>
            <button 
              type="button" 
              class="tab-btn" 
              [class.active]="tabActiva() === 'productos'"
              (click)="tabActiva.set('productos')"
            >
              <app-icon name="coffee" [size]="16" />
              <span>Cafetería ({{ catalogosService.productosSimples().length }})</span>
            </button>
          </div>
        </div>
      </div>

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
                    <td><strong>{{ pres.nombre }}</strong></td>
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
                    <td><strong>{{ top.nombre }}</strong></td>
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
          <div class="card-header space-between">
            <h3>Bebidas y Cafetería Envasada</h3>
            <button type="button" class="btn btn-sm btn-secondary" (click)="catalogosService.cargarProductosSimples()">
              <app-icon name="refresh" [size]="14" />
              <span>Refrescar</span>
            </button>
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
                @for (prod of catalogosService.productosSimples(); track prod.id) {
                  <tr>
                    <td><strong>{{ prod.nombre }}</strong></td>
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
                        <span class="supplier-tag">
                          <app-icon name="truck" [size]="14" />
                          <span>{{ prod.proveedor.razonSocial }}</span>
                        </span>
                      } @else {
                        <span class="text-muted small">Sin asignar</span>
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
              <input id="catProdCat" type="text" class="form-control" [(ngModel)]="productoForm.categoria" />
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
  `]
})
export class CatalogosComponent implements OnInit {
  public readonly catalogosService = inject(CatalogosService);
  public readonly proveedoresService = inject(ProveedoresService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  public readonly opcionesIva = OPCIONES_TIPO_IVA;

  public readonly tabActiva = signal<'sabores' | 'presentaciones' | 'toppings' | 'productos'>('sabores');
  public readonly guardandoItem = signal<boolean>(false);

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
    this.route.params.subscribe(params => {
      const seccion = params['seccion'];
      if (seccion && ['sabores', 'presentaciones', 'toppings', 'productos'].includes(seccion)) {
        this.tabActiva.set(seccion as any);
      }
    });

    this.catalogosService.cargarSabores();
    this.catalogosService.cargarPresentaciones();
    this.catalogosService.cargarToppings();
    this.catalogosService.cargarProductosSimples();
    this.proveedoresService.cargarProveedores();
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
      },
      error: (err) => {
        this.guardandoItem.set(false);
        this.toast.error(err.error?.mensaje || 'Error al guardar sabor.');
      }
    });
  }

  toggleDisponibilidadSabor(sab: Sabor): void {
    if (!sab.id) return;
    this.catalogosService.toggleDisponibilidadSabor(sab.id, !sab.disponible).subscribe();
  }

  confirmarEliminarSabor(sab: Sabor): void {
    if (!sab.id) return;
    if (confirm(`¿Eliminar sabor "${sab.nombre}"?`)) {
      this.catalogosService.eliminarSabor(sab.id).subscribe();
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
      this.catalogosService.eliminarPresentacion(pres.id).subscribe();
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
      },
      error: (err) => {
        this.guardandoItem.set(false);
        this.toast.error(err.error?.mensaje || 'Error al guardar topping.');
      }
    });
  }

  toggleDisponibilidadTopping(top: Topping): void {
    if (!top.id) return;
    this.catalogosService.toggleDisponibilidadTopping(top.id, !top.disponible).subscribe();
  }

  confirmarEliminarTopping(top: Topping): void {
    if (!top.id) return;
    if (confirm(`¿Eliminar topping "${top.nombre}"?`)) {
      this.catalogosService.eliminarTopping(top.id).subscribe();
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
      this.catalogosService.eliminarProductoSimple(prod.id).subscribe();
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
}

