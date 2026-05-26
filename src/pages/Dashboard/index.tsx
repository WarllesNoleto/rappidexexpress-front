/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import { MapPin, WhatsappLogo } from "phosphor-react";

import { DeliveryContext } from "../../context/DeliveryContext";
import api, { SOCKET_URL } from "../../services/api";
import { City, Motoboy, Report } from "../../shared/interfaces";
import {
  getLinkToWhatsapp,
  messageTypes,
} from "../../shared/constants/whatsapp.constants";

import {
  BaseButton,
  Container,
  ContainerButtons,
  ContainerDeliveries,
  ContainerImagem,
  ContainerInfo,
  ContainerLoading,
  ContainerOrder,
  ContainerShopkeeper,
  ContainerStatus,
  Delivery,
  Flag,
  Link,
  OrderActions,
  OrderButton,
  SelectContainer,
  ShopkeeperInfo,
  ShopkeeperProfileImage,
  Status,
} from "./styles";
import { Loader } from "../../components/Loader";
import { BaseModal } from "../../components/Modal";
import {
  StatusDelivery,
  UserType,
} from "../../shared/constants/enums.constants";


type DeliveryUpdateData = {
  status?: string;
  motoboyId?: string;
  observation?: string;
  destinationObservation?: string;
  destinationObservationConfirmed?: boolean;
  deliveryCode?: string;
};

type DeliveryCountsDelta = {
  pending: number;
  assigned: number;
};

type DeliveryCardProps = {
  report: Report;
  statusFilter: string;
  permission: string | null;
  selectedMotoboy: string;
  motoboys: Motoboy[];
  isUpdating: boolean;
  onSelectMotoboy: (reportId: string, motoboyId: string) => void;
  onSave: (report: Report) => void;
  onCancel: (report: Report) => void;
  onNextStep: (report: Report) => void;
  onDelete: (report: Report) => void;
  onDeliveryCodeChange: (reportId: string, value: string) => void;
  getButtonText: (currentStatus: string, report?: Report) => string;
  getHours: (date: string) => string;
  formatPhoneNumber: (phone: string) => string;
  getIfoodOrderNumber: (observation?: string) => string | null;
  getClientWhatsappMessage: (report: Report) => string | undefined;
  deliveryCode: string;
  previewObservation: string;
  shouldShowObservationPreview: boolean;
  canManageReleaseOrder: boolean;
};


const hasActiveIfoodMerchant = (source: any): boolean => {
  const legacyMerchant = String(source?.ifoodMerchantId || "").trim();

  const merchants = Array.isArray(source?.ifoodMerchants)
    ? source.ifoodMerchants
    : [];

  const hasMerchantInList = merchants.some((merchant: any) => {
    const merchantId = String(merchant?.merchantId || "").trim();
    return Boolean(merchantId) && merchant?.enabled !== false;
  });

  return Boolean(legacyMerchant || hasMerchantInList);
};

const getIfoodClientAddress = (observation?: string): string | null => {
  if (!observation) {
    return null;
  }

  const match = observation.match(/(?:Endere[cç]o|End)\s*[:-]\s*([^\n|]+)/i);

  if (!match?.[1]) {
    return null;
  }

  const address = match[1].trim();

  if (!address || /^https?:\/\//i.test(address)) {
    return null;
  }

  return address;
};

const getIfoodClientLocationLink = (
  observation?: string,
  clientLocation?: string,
): string | null => {
  const normalizedClientLocation = String(clientLocation || "").trim();
  if (normalizedClientLocation) {
    return normalizedClientLocation;
  }

  if (!observation) {
    return null;
  }

  const match = observation.match(/Localização:\s*(https?:\/\/\S+)/i);

  if (!match?.[1]) {
    return null;
  }

  return match[1].trim();
};

const getGoogleMapsLinkFromAddress = (address?: string | null): string | null => {
  const normalizedAddress = String(address || "").trim();

  if (!normalizedAddress) {
    return null;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(normalizedAddress)}`;
};

const DeliveryCard = memo(
  function DeliveryCard({
    report,
    statusFilter,
    permission,
    selectedMotoboy,
    motoboys,
    isUpdating,
    onSelectMotoboy,
    onSave,
    onCancel,
    onNextStep,
    onDelete,
    onDeliveryCodeChange,
    getButtonText,
    getHours,
    formatPhoneNumber,
    getIfoodOrderNumber,
    getClientWhatsappMessage,
    deliveryCode,
    previewObservation,
    shouldShowObservationPreview,
    canManageReleaseOrder,
  }: DeliveryCardProps) {
    const getClientVisualStatus = (delivery: Report) => {
      if (delivery.collectedAt) return "Motoboy está a caminho";
      if (delivery.arrivedAtStoreAt && !delivery.collectedAt) {
        return "Motoboy chegou ao estabelecimento";
      }
      if (delivery.motoboyId && !delivery.arrivedAtStoreAt) {
        return "Motoboy indo até o estabelecimento";
      }
      return "Aguardando motoboy";
    };

    const getEstablishmentVisualStatus = (delivery: Report) => {
      if (delivery.collectedAt) return "Pedido coletado pelo motoboy";
      if (delivery.arrivedAtStoreAt && !delivery.collectedAt) {
        return "Motoboy chegou no estabelecimento";
      }
      if (delivery.motoboyId && !delivery.arrivedAtStoreAt) {
        return "Motoboy indo até o estabelecimento";
      }
      return "Aguardando motoboy";
    };

    const isIfoodOrder =
      Boolean(report.isIfoodOrder) ||
      report.observation?.includes("Pedido iFood #") ||
      report.observation?.includes("Pedido iFood");
    const ifoodOrderNumber =
      getIfoodOrderNumber(report.observation) ||
      (report as any).ifoodDisplayId ||
      (report as any).ifoodOrderId ||
      null;
    const ifoodClientLocationLink = report.addressMapsUrl || getIfoodClientLocationLink(
      report.observation,
      report.clientLocation,
    );
    const ifoodClientAddress = report.clientAddress || getIfoodClientAddress(report.observation);
    const googleMapsAddressLink = getGoogleMapsLinkFromAddress(ifoodClientAddress);
    const motoboySelectId = `motoboy-${report.id}`;
    const shouldShowDeliveryCodeInput =
      isIfoodOrder &&
      (report.status === StatusDelivery.ARRIVED_AT_DESTINATION ||
        report.status === StatusDelivery.AWAITING_CODE);
    const isMotoboy = permission === UserType.MOTOBOY;

    const canMotoboyAdvanceDelivery =
      isMotoboy &&
      [
        StatusDelivery.PENDING,
        StatusDelivery.ONCOURSE,
        StatusDelivery.ARRIVED_AT_STORE,
        StatusDelivery.COLLECTED,
        StatusDelivery.ARRIVED_AT_DESTINATION,
        StatusDelivery.AWAITING_CODE,
      ].includes(report.status as StatusDelivery);

    const canAdvanceDelivery = canManageReleaseOrder || canMotoboyAdvanceDelivery;
    const canShowDeliveryCodeInput = canManageReleaseOrder || isMotoboy;

    return (
      <Delivery
        isfree={report.status === StatusDelivery.PENDING}
        isIfood={isIfoodOrder}
      >
        <ContainerShopkeeper>
          <ContainerImagem>
            <ShopkeeperProfileImage src={report.establishmentImage} />
          </ContainerImagem>

          <ShopkeeperInfo>
            <p>{report.establishmentName}</p>

            <Link
              href={getLinkToWhatsapp(
                report.establishmentPhone,
                messageTypes.motoboy,
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              {formatPhoneNumber(report.establishmentPhone)}{" "}
              <WhatsappLogo size={18} />
            </Link>

            <Link
              href={report.establishmentLocation}
              target="_blank"
              rel="noopener noreferrer"
            >
              <p>Localização</p> <MapPin size={18} />
            </Link>
          </ShopkeeperInfo>
        </ContainerShopkeeper>

        {statusFilter !== StatusDelivery.PENDING && (
          <ContainerOrder>
            <ContainerStatus>
              <p>Status:</p>
              <Status type={report.status}>{report.status}</Status>
            </ContainerStatus>
            <p>
              {permission === UserType.SHOPKEEPER
                ? getEstablishmentVisualStatus(report)
                : getClientVisualStatus(report)}
            </p>
            <p>Forma de pagamento: {report.payment}</p>
            <p>Valor: R$ {report.value}</p>
            <p>Pix: {report.establishmentPix}</p>
            <p>Refrigerante: {report.soda}</p>
          </ContainerOrder>
        )}

        <ContainerInfo>
          <div>
            {isIfoodOrder && <p>Pedido iFood: {ifoodOrderNumber || "Não informado"}</p>}
            {isIfoodOrder && <p>Loja iFood: {report.ifoodMerchantName || report.ifoodMerchantId || "Não informada"}</p>}

            <p>Cliente: {report.clientName}</p>
            {statusFilter !== StatusDelivery.PENDING && ifoodClientAddress && (
              <p>Endereço: {ifoodClientAddress}</p>
            )}
            {statusFilter !== StatusDelivery.PENDING && ifoodClientLocationLink && (
              <Link
                href={ifoodClientLocationLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <p>Ver no mapa</p> <MapPin size={18} />
              </Link>
            )}
            {statusFilter !== StatusDelivery.PENDING && !ifoodClientLocationLink && googleMapsAddressLink && (
              <Link
                href={googleMapsAddressLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <p>Ver no mapa</p> <MapPin size={18} />
              </Link>
            )}
          </div>

          {statusFilter !== StatusDelivery.PENDING && (
            <Link
              href={getLinkToWhatsapp(
                report.clientPhone,
                messageTypes.client,
                getClientWhatsappMessage(report),
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              {formatPhoneNumber(report.clientPhone)} <WhatsappLogo size={18} />
            </Link>
          )}
        </ContainerInfo>

        {statusFilter !== StatusDelivery.PENDING && (
          <ContainerInfo>
            <p>Motoboy: {report.motoboyName}</p>
            <Link
              href={getLinkToWhatsapp(
                report.motoboyPhone,
                messageTypes.establishment,
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              {formatPhoneNumber(report.motoboyPhone)} <WhatsappLogo size={18} />
            </Link>
          </ContainerInfo>
        )}

        <ContainerInfo>
          {report.createdAt && <p>Criado: {getHours(report.createdAt)}</p>}
          {report.onCoursedAt && <p>Atribuído: {getHours(report.onCoursedAt)}</p>}
          {report.collectedAt && <p>Coletado: {getHours(report.collectedAt)}</p>}
          {report.finishedAt && <p>Finalizado: {getHours(report.finishedAt)}</p>}
        </ContainerInfo>

        {canManageReleaseOrder && (
          <SelectContainer>
            <label htmlFor={motoboySelectId}>Motoboy:</label>
            <select
              id={motoboySelectId}
              disabled={isUpdating}
              value={selectedMotoboy}
              onChange={(e) => onSelectMotoboy(report.id, e.target.value)}
            >
              <option value="">Selecione o motoboy:</option>
              {motoboys.map((motoboy: Motoboy) => (
                <option key={motoboy.id} value={motoboy.id}>
                  {motoboy.name}
                </option>
              ))}
            </select>
          </SelectContainer>
        )}

        {shouldShowDeliveryCodeInput && canShowDeliveryCodeInput && (
          <SelectContainer>
            <label htmlFor={`delivery-code-${report.id}`}>
              Código de entrega iFood:
            </label>
            <input
              id={`delivery-code-${report.id}`}
              type="text"
              value={deliveryCode}
              disabled={isUpdating}
              placeholder="Digite o código informado pelo cliente"
              onChange={(e) => onDeliveryCodeChange(report.id, e.target.value)}
            />
          </SelectContainer>
        )}

        {(report.status === StatusDelivery.ARRIVED_AT_DESTINATION ||
          report.status === StatusDelivery.AWAITING_CODE) &&
          shouldShowObservationPreview && (
            <ContainerInfo>
              <p><b>Observação do pedido:</b> {previewObservation || "Sem observação."}</p>
            </ContainerInfo>
          )}

        <OrderActions>
          {canManageReleaseOrder &&
            report.status !== StatusDelivery.PENDING && (
              <>
                <OrderButton typebutton={true} onClick={() => onSave(report)}>
                  Salvar
                </OrderButton>
                <OrderButton typebutton={false} onClick={() => onCancel(report)}>
                  Cancelar
                </OrderButton>
              </>
            )}

          {canAdvanceDelivery && (
            <OrderButton typebutton={true} onClick={() => onNextStep(report)}>
              {getButtonText(report.status, report)}
            </OrderButton>
          )}

          {permission !== "motoboy" && report.status === StatusDelivery.PENDING && (
            <OrderButton typebutton={false} onClick={() => onDelete(report)}>
              Apagar
            </OrderButton>
          )}
        </OrderActions>
      </Delivery>
    );
  },
  areDeliveryCardPropsEqual,
);

function areDeliveryCardPropsEqual(prev: DeliveryCardProps, next: DeliveryCardProps) {
  return (
    prev.report === next.report &&
    prev.statusFilter === next.statusFilter &&
    prev.permission === next.permission &&
    prev.selectedMotoboy === next.selectedMotoboy &&
    prev.deliveryCode === next.deliveryCode &&
    prev.motoboys === next.motoboys &&
    prev.isUpdating === next.isUpdating &&
    prev.canManageReleaseOrder === next.canManageReleaseOrder &&
    prev.previewObservation === next.previewObservation &&
    prev.shouldShowObservationPreview === next.shouldShowObservationPreview
  );
}

export function Dashboard() {
  const { token, permission } = useContext(DeliveryContext);

  const [status, setStatus] = useState<string>(`${StatusDelivery.PENDING}`);
  const [loading, setLoading] = useState<boolean>(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [motoboys, setMotoboys] = useState<Motoboy[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [assignedCount, setAssignedCount] = useState<number>(0);
  const [waitingReleaseCount, setWaitingReleaseCount] = useState<number>(0);
  const [updatingDeliveryIds, setUpdatingDeliveryIds] = useState<Set<string>>(
    () => new Set(),
  );

  const [selectedMotoboyByReport, setSelectedMotoboyByReport] = useState<
    Record<string, string>
  >({});
  const [deliveryCodeByReport, setDeliveryCodeByReport] = useState<
    Record<string, string>
  >({});
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentCityId, setCurrentCityId] = useState<string>("");
  const [canViewReleaseTab, setCanViewReleaseTab] = useState<boolean>(
    permission === UserType.ADMIN || permission === UserType.SUPERADMIN,
  );
  const [canManageReleaseOrder, setCanManageReleaseOrder] = useState<boolean>(
    permission === UserType.ADMIN || permission === UserType.SUPERADMIN,
  );
  const reloadTimeoutRef = useRef<number | null>(null);
  const refreshRequestIdRef = useRef(0);
  const didFirstLoadRef = useRef(false);

  const [observationModalDeliveryId, setObservationModalDeliveryId] = useState<string | null>(null);
  const [observationTextByDeliveryId, setObservationTextByDeliveryId] = useState<Record<string, string>>({});
  const [observationSavingId, setObservationSavingId] = useState<string | null>(null);

  useEffect(() => {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  }, [token]);

  function openObservationModal(deliveryId: string, initialText = "") {
    setObservationModalDeliveryId(deliveryId);
    setObservationTextByDeliveryId((state) => ({
      ...state,
      [deliveryId]: state[deliveryId] ?? initialText,
    }));
  }

  function closeObservationModal() {
    setObservationModalDeliveryId(null);
  }

  function clearObservationText(deliveryId: string) {
    setObservationTextByDeliveryId((state) => {
      const next = { ...state };
      delete next[deliveryId];
      return next;
    });
  }

  function getDateValue(date?: string) {
    if (!date) return 0;

    const parsed = new Date(date).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  const sortedReports = useMemo(() => {
    const sortedByCreatedAt = [...reports].sort(
      (a, b) => getDateValue(a.createdAt) - getDateValue(b.createdAt),
    );

    if (permission !== UserType.MOTOBOY) {
      return sortedByCreatedAt;
    }

    const statusPriority: Record<string, number> = {
      [StatusDelivery.ONCOURSE]: 0,
      [StatusDelivery.ARRIVED_AT_STORE]: 0,
      [StatusDelivery.COLLECTED]: 1,
      [StatusDelivery.ARRIVED_AT_DESTINATION]: 1,
      [StatusDelivery.AWAITING_CODE]: 1,
    };

    return sortedByCreatedAt.sort((a, b) => {
      const priorityA = statusPriority[a.status] ?? 99;
      const priorityB = statusPriority[b.status] ?? 99;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return getDateValue(a.createdAt) - getDateValue(b.createdAt);
    });
  }, [permission, reports]);

  const statusFilterSet = useMemo(() => {
    return new Set(status.split(",").filter(Boolean));
  }, [status]);

  const clientWhatsappMessageByCityId = useMemo(() => {
    const cityMessageMap = new Map<string, string>();

    cities.forEach((city) => {
      const cityId = String(city.id);
      const customMessage = city.clientWhatsappMessage?.trim();

      if (customMessage) {
        cityMessageMap.set(cityId, customMessage);
      }
    });

    return cityMessageMap;
  }, [cities]);

  function normalizeDeliveryResponse(payload: any): Report | null {
    if (!payload) return null;

    if (payload.data && typeof payload.data === "object") {
      return payload.data as Report;
    }

    return payload as Report;
  }

  function isAssignedDelivery(report?: Partial<Report> | null) {
    if (!report) return false;

    const statusValue = report.status;
    const isActiveDelivery = report.isActive !== false;
    const assignedStatuses: StatusDelivery[] = [
      StatusDelivery.ONCOURSE,
      StatusDelivery.ARRIVED_AT_STORE,
      StatusDelivery.COLLECTED,
      StatusDelivery.ARRIVED_AT_DESTINATION,
      StatusDelivery.AWAITING_CODE,
    ];

    return isActiveDelivery && Boolean(statusValue && assignedStatuses.includes(statusValue as StatusDelivery));
  }

  function getCountDelta(
    previousReport?: Partial<Report> | null,
    nextReport?: Partial<Report> | null,
  ): DeliveryCountsDelta {
    const previousStatus = previousReport?.status;
    const nextStatus = nextReport?.status;

    return {
      pending:
        (previousStatus === StatusDelivery.PENDING ? -1 : 0) +
        (nextStatus === StatusDelivery.PENDING ? 1 : 0),
      assigned:
        (isAssignedDelivery(previousReport) ? -1 : 0) +
        (isAssignedDelivery(nextReport) ? 1 : 0),
    };
  }

  function statusMatchesCurrentFilter(statusValue?: string) {
    if (!statusValue) return false;

    return statusFilterSet.has(statusValue);
  }

  function updateReportInListLocally(updatedReport: Report) {
    setReports((previousReports) => {
      const withUpdate = previousReports.map((item) =>
        item.id === updatedReport.id ? { ...item, ...updatedReport } : item,
      );

      if (!statusMatchesCurrentFilter(updatedReport.status)) {
        return withUpdate.filter((item) => item.id !== updatedReport.id);
      }

      return withUpdate;
    });
  }

  function startUpdatingDelivery(deliveryId: string) {
    setUpdatingDeliveryIds((state) => {
      if (state.has(deliveryId)) {
        return state;
      }

      const nextState = new Set(state);
      nextState.add(deliveryId);
      return nextState;
    });
  }

  function stopUpdatingDelivery(deliveryId: string) {
    setUpdatingDeliveryIds((state) => {
      if (!state.has(deliveryId)) {
        return state;
      }

      const nextState = new Set(state);
      nextState.delete(deliveryId);
      return nextState;
    });
  }

  function isDeliveryUpdating(deliveryId: string) {
    return updatingDeliveryIds.has(deliveryId);
  }

  const refreshDashboard = useCallback(
    async (showLoader = false) => {
      const requestId = ++refreshRequestIdRef.current;

      if (showLoader) {
        setLoading(true);
      }

      try {
        const [currentResponse, countsResponse] = await Promise.all([
          api.get(`/delivery?status=${status}`),
          api.get("/delivery/counts"),
        ]);


        if (requestId !== refreshRequestIdRef.current) {
          return;
        }

        const rawReports = Array.isArray(currentResponse.data?.data)
          ? currentResponse.data.data
          : [];
        const nextPendingCount = Number(countsResponse.data?.pending) || 0;
        const nextAssignedCount = Number(countsResponse.data?.assigned) || 0;
        const nextWaitingReleaseCount =
          Number(countsResponse.data?.waitingRelease) || 0;

        setReports(rawReports);
        setPendingCount(nextPendingCount);
        setAssignedCount(nextAssignedCount);
        setWaitingReleaseCount(nextWaitingReleaseCount);
      } catch (error: any) {
        if (requestId !== refreshRequestIdRef.current) {
          return;
        }

        alert(error.response?.data?.message || "Erro ao carregar pedidos.");
      } finally {
        if (showLoader && requestId === refreshRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [status],
  );

  const getCities = useCallback(async () => {
    try {
      const response = await api.get("/city");
      const rawData = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];

      setCities(rawData as City[]);
    } catch (error) {
      console.error("Erro ao carregar cidades:", error);
    }
  }, []);

  const getMotoboys = useCallback(async () => {
    if (!canManageReleaseOrder && permission !== UserType.MOTOBOY) return;

    try {
      const motoboysRes = await api.get("/user/motoboys");
      setMotoboys(motoboysRes.data ?? []);
    } catch (error) {
      console.error("Erro ao carregar motoboys:", error);
    }
  }, [canManageReleaseOrder, permission]);

  const getMyself = useCallback(async () => {
    try {
      const response = await api.get("/user/myself");
      const currentUser = response.data?.data ?? response.data ?? {};

      setCurrentUserId(currentUser.id ?? "");
      setCurrentCityId(currentUser.cityId ?? "");

      const currentType = String(currentUser.type || permission || "").toLowerCase();
      const currentPermission = String(currentUser.permission || "").toLowerCase();

      const isAdminOrSuperadmin =
        currentType === UserType.ADMIN ||
        currentType === UserType.SUPERADMIN ||
        currentPermission === UserType.ADMIN ||
        currentPermission === UserType.SUPERADMIN;

      const isShopkeeper =
        currentType === UserType.SHOPKEEPER ||
        currentType === UserType.SHOPKEEPERADMIN;

      const hasIfoodIntegration =
        Boolean(
          currentUser.useIfoodIntegration ||
            currentUser.ifoodEnabled ||
            currentUser.establishment?.useIfoodIntegration ||
            currentUser.establishment?.ifoodEnabled ||
            currentUser.selectedEstablishment?.useIfoodIntegration ||
            currentUser.selectedEstablishment?.ifoodEnabled ||
            currentUser.company?.useIfoodIntegration ||
            currentUser.company?.ifoodEnabled,
        ) &&
        (hasActiveIfoodMerchant(currentUser) ||
          hasActiveIfoodMerchant(currentUser.establishment) ||
          hasActiveIfoodMerchant(currentUser.selectedEstablishment) ||
          hasActiveIfoodMerchant(currentUser.company));

      const nextCanViewReleaseTab =
        isAdminOrSuperadmin || (isShopkeeper && hasIfoodIntegration);
      const nextCanManageReleaseOrder =
        isAdminOrSuperadmin || (isShopkeeper && hasIfoodIntegration);

      setCanViewReleaseTab(nextCanViewReleaseTab);
      setCanManageReleaseOrder(nextCanManageReleaseOrder);
    } catch (error) {
      console.error("Erro ao carregar usuário atual:", error);
    }
  }, [permission]);



  async function handleConfirmObservation() {
    if (!observationModalDeliveryId) return;

    const deliveryId = observationModalDeliveryId;
    const finalText = (observationTextByDeliveryId[deliveryId] || "").trim();

    try {
      setObservationSavingId(deliveryId);

      const response = await api.put(`/delivery/${deliveryId}`, {
        destinationObservation: finalText || "Sem observação.",
        destinationObservationConfirmed: true,
      });

      const updatedReport = normalizeDeliveryResponse(response.data);

      if (updatedReport) {
        updateReportInListLocally(updatedReport);
      } else {
        await refreshDashboard(false);
      }

      closeObservationModal();
      clearObservationText(deliveryId);
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao salvar observação.");
    } finally {
      setObservationSavingId(null);
    }
  }
  async function handlerNextStep(report: Report) {
    if (isDeliveryUpdating(report.id)) {
      return;
    }

    const selectedMotoboy = getSelectedMotoboy(report)?.trim();

    let data: DeliveryUpdateData | null = null;
    let newStatus = "";

    if (report.status === StatusDelivery.AWAITING_RELEASE) {
      await api.put(
        `/delivery/${report.id}/release`,
        selectedMotoboy ? { motoboyId: selectedMotoboy } : {},
      );
      return refreshDashboard(false);
    }

    if (report.status === StatusDelivery.PENDING) {
      if (!selectedMotoboy) {
        alert("Selecione o motoboy");
        return;
      }

      newStatus = StatusDelivery.ONCOURSE;
      data = {
        status: newStatus,
        motoboyId: selectedMotoboy,
      };
    } else if (report.status === StatusDelivery.ONCOURSE) {
      newStatus = StatusDelivery.ARRIVED_AT_STORE;
      data = {
        status: newStatus,
      };
    } else if (report.status === StatusDelivery.ARRIVED_AT_STORE) {
      newStatus = StatusDelivery.COLLECTED;
      data = {
        status: newStatus,
      };
    } else if (report.status === StatusDelivery.COLLECTED) {
      newStatus = StatusDelivery.ARRIVED_AT_DESTINATION;
      data = {
        status: newStatus,
      };
    } else if (
      report.status === StatusDelivery.ARRIVED_AT_DESTINATION ||
      report.status === StatusDelivery.AWAITING_CODE
    ) {
      if (!report.destinationObservationConfirmed) {
        openObservationModal(report.id, report.destinationObservation?.trim() || "");
        return;
      }

      newStatus = StatusDelivery.FINISHED;

      const isIfoodOrder =
        Boolean(report.isIfoodOrder) ||
        report.observation?.includes("Pedido iFood #") ||
        report.observation?.includes("Pedido iFood");
      let deliveryCode = "";

      if (isIfoodOrder) {
        deliveryCode = (deliveryCodeByReport[report.id] || "").trim();

        if (!deliveryCode) {
          alert("Informe o código de entrega do iFood.");
          return;
        }
      }

      data = {
        status: newStatus,
        deliveryCode,
      };
    }

    if (!data || !newStatus) {
      return;
    }

    try {
      startUpdatingDelivery(report.id);
      const response = await api.put(`/delivery/${report.id}`, data);
      const updatedReport = normalizeDeliveryResponse(response.data);

      if (!updatedReport) {
        await refreshDashboard(false);
        alert(`Solicitação avançada para o passo ${newStatus}`);
        return;
      }

      if (
        newStatus === StatusDelivery.ONCOURSE &&
        data.motoboyId &&
        updatedReport.motoboyId &&
        updatedReport.motoboyId !== data.motoboyId
      ) {
        await refreshDashboard(false);
        alert("Essa entrega já foi atribuída a outro entregador.");
        return;
      }

      const delta = getCountDelta(
        report,
        { ...report, ...updatedReport, status: updatedReport.status || newStatus },
      );
      setPendingCount((state) => Math.max(0, state + delta.pending));
      setAssignedCount((state) => Math.max(0, state + delta.assigned));
      updateReportInListLocally(updatedReport);
      alert(`Solicitação avançada para o passo ${newStatus}`);
      setDeliveryCodeByReport((state) => {
        const nextState = { ...state };
        delete nextState[report.id];
        return nextState;
      });
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao atualizar pedido.");
    } finally {
      stopUpdatingDelivery(report.id);
    }
  }

  async function handlerSave(report: Report) {
    if (isDeliveryUpdating(report.id)) {
      return;
    }

    const selectedMotoboy = getSelectedMotoboy(report)?.trim();

    if (!selectedMotoboy) {
      alert("Selecione o motoboy");
      return;
    }

    try {
      startUpdatingDelivery(report.id);
      const response = await api.put(`/delivery/${report.id}`, {
        motoboyId: selectedMotoboy,
      });

      const updatedReport = normalizeDeliveryResponse(response.data);

      if (updatedReport) {
        const normalizedReport =
          report.status === StatusDelivery.AWAITING_RELEASE
            ? { ...updatedReport, status: StatusDelivery.AWAITING_RELEASE }
            : updatedReport;
        const delta = getCountDelta(report, { ...report, ...normalizedReport });
        setPendingCount((state) => Math.max(0, state + delta.pending));
        setAssignedCount((state) => Math.max(0, state + delta.assigned));
        updateReportInListLocally(normalizedReport);
      } else {
        await refreshDashboard(false);
      }
      alert("Motoboy foi atualizado com sucesso.");
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao salvar motoboy.");
    } finally {
      stopUpdatingDelivery(report.id);
    }
  }

  async function handlerCancel(report: Report) {
    if (isDeliveryUpdating(report.id)) {
      return;
    }

    const confirmMessage = window.confirm(
      "Você realmente deseja apagar essa entrega?",
    );

    if (!confirmMessage) {
      return;
    }

    try {
      startUpdatingDelivery(report.id);
      await api.put(`/delivery/${report.id}`, {
        status: "CANCELADO",
      });

      const delta = getCountDelta(report, { ...report, status: StatusDelivery.CANCELED });
      setPendingCount((state) => Math.max(0, state + delta.pending));
      setAssignedCount((state) => Math.max(0, state + delta.assigned));
      setReports((state) => state.filter((item) => item.id !== report.id));
      alert("O pedido foi cancelado com sucesso.");
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao cancelar pedido.");
    } finally {
      stopUpdatingDelivery(report.id);
    }
  }

  async function handlerDelete(report: Report) {
    if (isDeliveryUpdating(report.id)) {
      return;
    }

    try {
      startUpdatingDelivery(report.id);
      await api.delete(`/delivery/${report.id}`);

      const delta = getCountDelta(report, undefined);
      setPendingCount((state) => Math.max(0, state + delta.pending));
      setAssignedCount((state) => Math.max(0, state + delta.assigned));
      setReports((state) => state.filter((item) => item.id !== report.id));
      alert("Solicitação apagada com sucesso.");
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao apagar pedido.");
    } finally {
      stopUpdatingDelivery(report.id);
    }
  }

  function getButtonText(currentStatus: string, report?: Report) {
    if (StatusDelivery.AWAITING_RELEASE === currentStatus) {
      return "Liberar produto";
    }
    if (StatusDelivery.PENDING === currentStatus) {
      return "Atribuir";
    }

    if (StatusDelivery.ONCOURSE === currentStatus) {
      return "Cheguei no estabelecimento";
    }

    if (StatusDelivery.ARRIVED_AT_STORE === currentStatus) {
      return "Coletar";
    }

    if (StatusDelivery.COLLECTED === currentStatus) {
      return "Cheguei ao destino";
    }

    if (
      StatusDelivery.ARRIVED_AT_DESTINATION === currentStatus ||
      StatusDelivery.AWAITING_CODE === currentStatus
    ) {
      if (!report?.destinationObservationConfirmed) {
        return "Observação";
      }

      const isIfoodOrder =
        Boolean(report?.isIfoodOrder) ||
        report?.observation?.includes("Pedido iFood #") ||
        report?.observation?.includes("Pedido iFood");
      return isIfoodOrder ? "Confirmar código" : "Finalizar";
    }

    return "Avançar";
  }

  function formatPhoneNumber(phone: string) {
    const number = `+55${phone}`;
    const cleaned = String(number).replace(/\D/g, "");
    const match = cleaned.match(/^(\d{2})(\d{2})(\d{4}|\d{5})(\d{4})$/);

    if (match) {
      return ["(", match[2], ")", match[3], "-", match[4]].join("");
    }

    return "";
  }

  function getIfoodOrderNumber(observation?: string) {
    if (!observation) {
      return null;
    }

    const match = observation.match(
      /Pedido\s*(?:do\s*)?iFood(?:\s*(?:n[ºo°.]|n[uú]mero))?\s*[:#-]?\s*([A-Za-z0-9-]+)/i,
    );

    if (!match) {
      return null;
    }

    return match[1];
  }

  function getHours(date: string) {
    return date.split("T")[1].substring(0, 5);
  }

  function getSelectedMotoboy(report: Report) {
    if (permission === UserType.MOTOBOY) {
      return currentUserId || report.motoboyId || "";
    }

    return (
      selectedMotoboyByReport[report.id] ||
      report.motoboyId ||
      (motoboys.length === 1 ? motoboys[0].id : "")
    );
  }

  const handleSelectMotoboy = useCallback(
    (reportId: string, motoboyId: string) => {
      setSelectedMotoboyByReport((state) => ({
        ...state,
        [reportId]: motoboyId,
      }));
    },
    [],
  );

  const handleDeliveryCodeChange = useCallback((reportId: string, value: string) => {
    setDeliveryCodeByReport((state) => ({
      ...state,
      [reportId]: value,
    }));
  }, []);

  const getClientWhatsappMessage = useCallback((report: Report) => {
    if (!report.establishmentCityId) {
      return undefined;
    }

    return clientWhatsappMessageByCityId.get(String(report.establishmentCityId));
  }, [clientWhatsappMessageByCityId]);

  useEffect(() => {
    void refreshDashboard(true).finally(() => {
      didFirstLoadRef.current = true;
    });
}, [refreshDashboard]);

  useEffect(() => {
    void getCities();
  }, [getCities]);

  useEffect(() => {
    void getMotoboys();
  }, [getMotoboys]);

  useEffect(() => {
    if (!canManageReleaseOrder && permission !== UserType.MOTOBOY) {
      return;
    }

    const motoboysPollingInterval = window.setInterval(() => {
      void getMotoboys();
    }, 30000);

    return () => {
      window.clearInterval(motoboysPollingInterval);
    };
  }, [canManageReleaseOrder, getMotoboys, permission]);

  useEffect(() => {
    void getMyself();
  }, [getMyself]);

  useEffect(() => {
    if (!canViewReleaseTab && status === StatusDelivery.AWAITING_RELEASE) {
      setStatus(StatusDelivery.PENDING);
    }
  }, [canViewReleaseTab, status]);

  useEffect(() => {
    if (!currentCityId) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    const reloadDeliveries = () => {
      if (reloadTimeoutRef.current) {
        window.clearTimeout(reloadTimeoutRef.current);
      }

      reloadTimeoutRef.current = window.setTimeout(() => {
        void refreshDashboard(false);
      }, 250);
    };

    socket.on("connect", () => {
      socket.emit("join-city", currentCityId);
    });

    socket.on("delivery:created", reloadDeliveries);
    socket.on("delivery:updated", reloadDeliveries);
    socket.on("delivery:deleted", reloadDeliveries);

    return () => {
      if (reloadTimeoutRef.current) {
        window.clearTimeout(reloadTimeoutRef.current);
      }

      socket.off("delivery:created", reloadDeliveries);
      socket.off("delivery:updated", reloadDeliveries);
      socket.off("delivery:deleted", reloadDeliveries);
      socket.disconnect();
    };
  }, [currentCityId, refreshDashboard]);

  return (
    <Container>
      <BaseModal
        isVisible={Boolean(observationModalDeliveryId)}
        handleClose={closeObservationModal}
        observation={observationModalDeliveryId ? (observationTextByDeliveryId[observationModalDeliveryId] || "") : ""}
        isSaving={Boolean(observationModalDeliveryId && observationSavingId === observationModalDeliveryId)}
        onObservationChange={(text) => {
          if (!observationModalDeliveryId) return;
          setObservationTextByDeliveryId((state) => ({
            ...state,
            [observationModalDeliveryId]: text,
          }));
        }}
        onConfirmObservation={() => {
          void handleConfirmObservation();
        }}
      />

      <ContainerButtons>
        {canViewReleaseTab && (
          <BaseButton
            typeReport={status === StatusDelivery.AWAITING_RELEASE}
            onClick={() => setStatus(StatusDelivery.AWAITING_RELEASE)}
          >
            Aguardando liberação
            <Flag>{waitingReleaseCount}</Flag>
          </BaseButton>
        )}

        <BaseButton
          typeReport={status === StatusDelivery.PENDING}
          onClick={() => setStatus(StatusDelivery.PENDING)}
        >
          Livres
          <Flag>{pendingCount}</Flag>
        </BaseButton>

        <BaseButton
          typeReport={
            status !== StatusDelivery.PENDING &&
            status !== StatusDelivery.AWAITING_RELEASE
          }
          onClick={() =>
            setStatus(
              `${StatusDelivery.ONCOURSE},${StatusDelivery.ARRIVED_AT_STORE},${StatusDelivery.COLLECTED},${StatusDelivery.ARRIVED_AT_DESTINATION},${StatusDelivery.AWAITING_CODE}`,
            )
          }
        >
          Atribuídos
          <Flag>{assignedCount}</Flag>
        </BaseButton>
      </ContainerButtons>

      <ContainerDeliveries>
        {loading ? (
          <ContainerLoading>
            <Loader size={40} biggestColor="green" smallestColor="gray" />
          </ContainerLoading>
        ) : (
          <>
            {sortedReports.map((report: Report) => (
              <DeliveryCard
                key={report.id}
                report={report}
                statusFilter={status}
                permission={permission}
                selectedMotoboy={getSelectedMotoboy(report)}
                motoboys={motoboys}
                isUpdating={isDeliveryUpdating(report.id)}
                onSelectMotoboy={handleSelectMotoboy}
                onSave={handlerSave}
                onCancel={handlerCancel}
                onNextStep={handlerNextStep}
                onDelete={handlerDelete}
                onDeliveryCodeChange={handleDeliveryCodeChange}
                getButtonText={getButtonText}
                getHours={getHours}
                formatPhoneNumber={formatPhoneNumber}
                getIfoodOrderNumber={getIfoodOrderNumber}
                getClientWhatsappMessage={getClientWhatsappMessage}
                deliveryCode={deliveryCodeByReport[report.id] || ""}
                previewObservation={report.destinationObservation?.trim() || ""}
                shouldShowObservationPreview={Boolean(report.destinationObservationConfirmed)}
                canManageReleaseOrder={canManageReleaseOrder}
              />
            ))}
          </>
        )}
      </ContainerDeliveries>
    </Container>
  );
}
