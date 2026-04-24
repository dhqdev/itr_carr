import os
import json
import webbrowser
import argparse
import geopandas as gpd
import folium
from folium import plugins
from shapely import wkt

# -------------------------------------------------------------------
# FONTE DE DADOS LOCAL
# -------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_CLEAN_PATH = os.path.join(BASE_DIR, "imovel_dados_clean.json")
LINHA_AMARELA_PATH = os.path.join(BASE_DIR, "Linha_amarela.json")


def load_local_data(path: str = JSON_CLEAN_PATH) -> dict:
    """Carrega o JSON consolidado com os lotes e imóveis."""
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Arquivo {os.path.basename(path)} não encontrado. Gere-o antes executando scripts/fix_imovel_json.py."
        )
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_linha_amarela_for_imovel(imovel_id: str | int, path: str = LINHA_AMARELA_PATH):
    """Carrega geometrias da Linha_amarela.json para o imóvel informado.

    Suporta:
    - Formato legado: objeto único com `identificador_lote` e `geometry`
    - Formato atual: FeatureCollection com múltiplas feições e imóveis
    """
    if not os.path.exists(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Formato FeatureCollection (novo)
        if isinstance(data, dict) and data.get("type") == "FeatureCollection":
            feats = data.get("features", [])
            if not isinstance(feats, list):
                return None
            selected = []
            for ft in feats:
                props = ft.get("properties", {}) if isinstance(ft, dict) else {}
                if str(props.get("identificador_lote")) == str(imovel_id):
                    selected.append(ft)
            if not selected:
                return None
            gdf = gpd.GeoDataFrame.from_features(selected, crs="EPSG:4326")
            return gdf

        # Formato legado (objeto único)
        file_imovel_id = data.get("identificador_lote")
        if file_imovel_id is None or str(file_imovel_id) != str(imovel_id):
            return None

        geom = data.get("geometry", {})
        if not isinstance(geom, dict) or "type" not in geom or "coordinates" not in geom:
            return None

        gdf = gpd.GeoDataFrame.from_features(
            [
                {
                    "type": "Feature",
                    "properties": {"nome": f"Linha amarela ({file_imovel_id})"},
                    "geometry": geom,
                }
            ],
            crs="EPSG:4326",
        )
        return gdf
    except Exception:
        return None


def select_from_list(prompt: str, options: list[str]) -> int:
    """Exibe uma lista enumerada e retorna o índice escolhido pelo usuário."""
    if not options:
        raise ValueError("Lista de opções vazia.")
    print(f"\n{prompt}")
    for i, opt in enumerate(options, 1):
        print(f"  {i}. {opt}")
    while True:
        escolha = input("Digite o número desejado: ").strip()
        try:
            i = int(escolha)
            if 1 <= i <= len(options):
                return i - 1
        except ValueError:
            pass
        print("Entrada inválida. Tente novamente.")


def extract_imoveis_for_lote(lote_obj: dict) -> list[dict]:
    """Extrai uma lista de imóveis (deduplicada por identificadorimovel, quando houver)."""
    resultados = lote_obj.get("result", [])
    if not isinstance(resultados, list):
        return []
    # Agrega por identificadorimovel quando possível
    grupos = {}
    for item in resultados:
        imovel_id = item.get("identificadorimovel") or item.get("codigoimovel") or "imovel"
        grupos.setdefault(imovel_id, []).append(item)
    # Produz lista com metadados úteis
    imoveis = []
    for imovel_id, itens in grupos.items():
        # Nome amigável
        nome = None
        for k in ("nomeimovel", "tema"):
            for it in itens:
                if it.get(k):
                    nome = it[k]
                    break
            if nome:
                break
        label = f"{imovel_id} - {nome}" if nome else str(imovel_id)
        imoveis.append({"id": imovel_id, "label": label, "itens": itens})
    return imoveis


def pick_geometry_wkt(imovel_itens: list[dict]) -> tuple[str, str] | tuple[None, None]:
    """Seleciona a melhor geometria (WKT) disponível dentre os itens do imóvel.
    Retorna (wkt, descricao_origem)."""
    if not imovel_itens:
        return None, None
    # Ordem de prioridade por tema, quando há 'geoareatema'
    tema_prioridade = [
        "Área do Imovel",
        "Área Líquida do Imóvel",
        "APP Total",
        "Área Consolidada",
        "Área de Reserva Legal Total",
        "Reserva Legal Proposta",
    ]
    # 1) Tentar 'geoareatema' com tema prioritário
    for tema in tema_prioridade:
        for it in imovel_itens:
            if it.get("tema") == tema and isinstance(it.get("geoareatema"), str):
                return it["geoareatema"], f"geoareatema ({tema})"
    # 2) Qualquer 'geoareatema'
    for it in imovel_itens:
        if isinstance(it.get("geoareatema"), str):
            return it["geoareatema"], "geoareatema"
    # 3) 'areatotal' (muitos blocos usam isso para WKT)
    for it in imovel_itens:
        if isinstance(it.get("areatotal"), str):
            return it["areatotal"], "areatotal"
    # 4) 'poligonoAreaImovel' como fallback
    for it in imovel_itens:
        if isinstance(it.get("poligonoAreaImovel"), str):
            return it["poligonoAreaImovel"], "poligonoAreaImovel"
    return None, None

def create_geodataframe_from_wkt(wkt_string: str, nome_imovel: str):
    """Converte uma string WKT em GeoDataFrame."""
    try:
        geom = wkt.loads(wkt_string)
        gdf = gpd.GeoDataFrame(
            data=[{"nome": nome_imovel}],
            geometry=[geom],
            crs="EPSG:4326"
        )
        print("2. Geometria WKT convertida para GeoDataFrame.")
        return gdf
    except Exception as e:
        print(f"   ERRO ao converter WKT para GeoDataFrame: {e}")
        return None

# Removido suporte KML (Google Earth). Usaremos apenas mapa interativo com camadas base selecionáveis.

def create_interactive_map(
    gdf,
    gdf_linha_amarela=None,
    filename: str = "mapa_interativo_sentinel.html",
    open_browser: bool = True,
    basemap: str = "esri",
    time_slider: bool = False,
    time_days: int = 7,
):
    """Cria um mapa Folium com camadas de imagem e enquadra a área do imóvel.

    basemap opções:
      - 'esri' (mais nítido)
      - 'sentinel' (Copernicus s2cloudless)
      - 'osm'
    """
    try:
        # Centro e limites (usa bounds para evitar warning de centroid em CRS geográfico)
        minx, miny, maxx, maxy = gdf.total_bounds
        if gdf_linha_amarela is not None and not gdf_linha_amarela.empty:
            y_minx, y_miny, y_maxx, y_maxy = gdf_linha_amarela.total_bounds
            minx = min(minx, y_minx)
            miny = min(miny, y_miny)
            maxx = max(maxx, y_maxx)
            maxy = max(maxy, y_maxy)
        # Aplica um pequeno buffer percentual para dar contexto visual
        pad_x = (maxx - minx) * 0.1 or 0.001
        pad_y = (maxy - miny) * 0.1 or 0.001
        bounds = [[miny - pad_y, minx - pad_x], [maxy + pad_y, maxx + pad_x]]
        map_center = [ (miny + maxy) / 2.0, (minx + maxx) / 2.0 ]
        m = folium.Map(location=map_center, zoom_start=14, tiles=None, max_zoom=20)

        # Camadas de fundo
        sentinel = folium.TileLayer(
            tiles='https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpeg',
            attr='Sentinel-2 cloudless © EOX IT Services GmbH | Copernicus Sentinel data',
            name='Sentinel-2',
            overlay=False,
            control=True,
            show=(basemap == 'sentinel')
        )
        esri = folium.TileLayer(
            tiles='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attr='Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
            name='Esri World Imagery',
            overlay=False,
            control=True,
            show=(basemap == 'esri')
        )
        osm = folium.TileLayer('OpenStreetMap', name='OpenStreetMap', show=(basemap == 'osm'))
        # Adiciona todas e respeita qual deve iniciar visível
        for t in (esri, sentinel, osm):
            t.add_to(m)

        # Se slider temporal estiver habilitado, adiciona camadas diárias do NASA GIBS (MODIS TrueColor)
        if time_slider:
            try:
                from datetime import date, timedelta
                today = date.today()
                # Gera uma sequência de datas (um dia de intervalo) mais antigas até hoje
                dates = [(today - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(max(1, time_days))]
                dates.reverse()  # crescente

                gibs_layers = []
                gibs_layer_names = []
                for i, d in enumerate(dates):
                    url = (
                        f"https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/"
                        f"MODIS_Terra_CorrectedReflectance_TrueColor/default/{d}/GoogleMapsCompatible_Level9/{{z}}/{{y}}/{{x}}.jpg"
                    )
                    lyr = folium.TileLayer(
                        tiles=url,
                        attr='Imagery courtesy of NASA GIBS',
                        name=f'GIBS {d}',
                        overlay=False,
                        control=False,
                        show=(i == len(dates) - 1)
                    )
                    lyr.add_to(m)
                    gibs_layers.append(lyr)
                    gibs_layer_names.append(lyr.get_name())

                # UI: slider para alternar entre datas
                # Contêiner do slider
                slider_html = (
                    '<div id="time-slider" style="position:absolute; z-index:9999; background:white; padding:8px; ' \
                    'border-radius:6px; top:10px; left:50%; transform:translateX(-50%); ' \
                    'box-shadow:0 1px 4px rgba(0,0,0,0.3); font-family:Arial, sans-serif; font-size:12px;">' \
                    '<label style="font-weight:600;">Data: <span id="time-date">{last_date}</span></label><br>' \
                    '<input type="range" id="time-range" min="0" max="{max_idx}" value="{max_idx}" step="1" style="width:320px;">' \
                    '</div>'
                ).format(last_date=dates[-1], max_idx=len(dates) - 1)

                m.get_root().html.add_child(folium.Element(slider_html))

                # Script para alternar visualização das camadas conforme o slider
                js_layers = ",".join(gibs_layer_names)
                js_dates = ",".join([f'"{d}"' for d in dates])
                js_code = f"""
                <script>
                  (function() {{
                    var map = {m.get_name()};
                    var layerObjs = [{js_layers}];
                    var dates = [{js_dates}];
                    function show(idx) {{
                      for (var i=0; i<layerObjs.length; i++) {{
                        if (i===idx) {{
                          if (!map.hasLayer(layerObjs[i])) map.addLayer(layerObjs[i]);
                        }} else {{
                          if (map.hasLayer(layerObjs[i])) map.removeLayer(layerObjs[i]);
                        }}
                      }}
                      var lab = document.getElementById('time-date');
                      if (lab) lab.textContent = dates[idx];
                    }}
                    var slider = document.getElementById('time-range');
                    if (slider) {{
                      slider.addEventListener('input', function(e) {{
                        var idx = parseInt(e.target.value, 10);
                        show(idx);
                      }});
                    }}
                    // Inicializa
                    show({len(dates) - 1});
                  }})();
                </script>
                """
                m.get_root().html.add_child(folium.Element(js_code))
            except Exception as _e:
                # Se falhar por qualquer motivo, apenas segue sem slider
                pass
        folium.GeoJson(
            gdf,
            # Área do imóvel em vermelho (somente contorno)
            style_function=lambda x: {"fill": False, "fillOpacity": 0.0, "color": "#FF0000", "weight": 3},
            tooltip=gdf.iloc[0]['nome']
        ).add_to(m)

        # Área amarela opcional (quando existir Linha_amarela.json para o imóvel selecionado)
        if gdf_linha_amarela is not None and not gdf_linha_amarela.empty:
            folium.GeoJson(
                gdf_linha_amarela,
                style_function=lambda x: {"fill": False, "fillOpacity": 0.0, "color": "#FFD700", "weight": 3},
                tooltip=folium.GeoJsonTooltip(fields=["nome"], aliases=["Área:"], sticky=True)
            ).add_to(m)
        # Controles úteis
        folium.LayerControl().add_to(m)
        plugins.Fullscreen().add_to(m)
        plugins.MiniMap(toggle_display=True).add_to(m)
        plugins.MousePosition(position='bottomright', separator=' , ', prefix='Lat/Lon:').add_to(m)

        # Ajusta o mapa para cobrir toda a área
        m.fit_bounds(bounds)
        m.save(filename)
        filepath = os.path.abspath(filename)
        print(f"4. Mapa salvo em: {filepath} (basemap: {basemap})")
        if open_browser:
            webbrowser.open(f"file://{filepath}")
    except Exception as e:
        print(f"   ERRO ao criar mapa interativo: {e}")

def export_static_png(gdf, filename: str = "area.png"):
    """Exporta uma imagem estática (PNG) do terreno usando tiles de fundo.
    Requer 'contextily' e 'matplotlib'. Caso não disponíveis, mostra aviso.
    """
    try:
        import contextily as ctx
        import matplotlib.pyplot as plt
    except Exception:
        print("Aviso: para exportar imagem estática instale: pip install contextily matplotlib")
        return

    try:
        # Reprojeta para Web Mercator para combinar com tiles
        gdf_m = gdf.to_crs(3857)
        ax = gdf_m.plot(edgecolor='#FF0000', facecolor='none', linewidth=2, figsize=(8, 8))
        # Define limites com margem
        minx, miny, maxx, maxy = gdf_m.total_bounds
        pad_x = (maxx - minx) * 0.1 or 100
        pad_y = (maxy - miny) * 0.1 or 100
        ax.set_xlim(minx - pad_x, maxx + pad_x)
        ax.set_ylim(miny - pad_y, maxy + pad_y)
        # Adiciona basemap (ESRI World Imagery costuma ser mais detalhado)
        try:
            ctx.add_basemap(ax, source=ctx.providers.Esri.WorldImagery)
        except Exception:
            # Fallback para Carto ou OSM
            ctx.add_basemap(ax, source=ctx.providers.CartoDB.Positron)
        plt.tight_layout()
        plt.savefig(filename, dpi=200)
        plt.close()
        print(f"5. Imagem estática salva em: {os.path.abspath(filename)}")
    except Exception as e:
        print(f"   ERRO ao exportar imagem estática: {e}")


def main():
    parser = argparse.ArgumentParser(description="Consulta de imóveis em lotes locais.")
    parser.add_argument("--lote", help="ID do lote para seleção direta (caso conhecido)")
    parser.add_argument("--imovel", help="ID do imóvel ou índice (1-based) dentro do lote", type=str)
    parser.add_argument("--auto", help="Seleciona automaticamente primeiro lote e primeiro imóvel", action="store_true")
    parser.add_argument("--no-browser", help="Não abrir o navegador automaticamente", action="store_true")
    parser.add_argument("--basemap", choices=["esri", "sentinel", "osm"], default="esri", help="Camada base de imagem (esri, sentinel, osm)")
    parser.add_argument("--static", help="Também gerar imagem estática PNG da área", action="store_true")
    args = parser.parse_args()
    try:
        data = load_local_data()
        lotes = list(data.keys())
        if not lotes:
            print("Nenhum lote encontrado no JSON.")
            return
        if args.auto:
            lote_id = lotes[0]
        elif args.lote and args.lote in lotes:
            lote_id = args.lote
        else:
            lote_idx = select_from_list("Selecione o Lote:", lotes)
            lote_id = lotes[lote_idx]
        lote_obj = data[lote_id]

        imoveis = extract_imoveis_for_lote(lote_obj)
        if not imoveis:
            print("Nenhum imóvel encontrado neste lote.")
            return
        if args.auto:
            imv = imoveis[0]
        elif args.imovel:
            # Tenta por ID ou índice numérico
            try:
                idx = int(args.imovel) - 1
                imv = imoveis[idx]
            except (ValueError, IndexError):
                # Busca por substring no label
                match = next((x for x in imoveis if args.imovel in x["label"] or args.imovel == str(x["id"])), None)
                if not match:
                    print("Imóvel especificado não encontrado. Use sem argumentos para modo interativo.")
                    return
                imv = match
        else:
            imoveis_labels = [i["label"] for i in imoveis]
            imv_idx = select_from_list(f"Selecione o Imóvel do lote {lote_id}:", imoveis_labels)
            imv = imoveis[imv_idx]

        wkt_geom, origem = pick_geometry_wkt(imv["itens"])
        if not wkt_geom:
            print("Não foi possível localizar geometria (WKT) para este imóvel.")
            return
        print(f"1. Geometria selecionada de: {origem}")
        gdf = create_geodataframe_from_wkt(wkt_geom, imv["label"])
        if gdf is None:
            return
        gdf_linha_amarela = load_linha_amarela_for_imovel(imv["id"])
        if gdf_linha_amarela is not None:
            print(f"3. Linha amarela encontrada e adicionada ao mapa ({len(gdf_linha_amarela)} área(s)).")
        else:
            print("3. Linha amarela não encontrada para este imóvel (seguindo apenas com área vermelha).")
        # Apenas mapa com camada base definida (ajustado aos limites)
        html_file = f"{lote_id}_imovel_{args.basemap}.html"
        create_interactive_map(
            gdf,
            gdf_linha_amarela=gdf_linha_amarela,
            filename=html_file,
            open_browser=not args.no_browser,
            basemap=args.basemap,
        )
        if args.static:
            export_static_png(gdf, filename=f"{lote_id}_imovel.png")
    except Exception as e:
        print(f"Ocorreu um erro inesperado no script: {e}")


# --- Bloco de Execução Principal ---
if __name__ == "__main__":
    main()