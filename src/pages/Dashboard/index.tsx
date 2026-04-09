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
  reportSelectedToModal: string;
  motoboys: Motoboy[];
  isUpdating: boolean;
  onSelectMotoboy: (reportId: string, motoboyId: string) => void;
  onSave: (report: Report) => void;
  onCancel: (report: Report) => void;
  onNextStep: (report: Report) => void;
  onDelete: (report: Report) => void;
  getButtonText: (currentStatus: string, id: string) => string;
  getHours: (date: string) => string;
  formatPhoneNumber: (phone: string) => string;
  getIfoodOrderNumber: (observation?: string) => string | null;
  getClientWhatsappMessage: (report: Report) => string | undefined;
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
    getButtonText,
    getHours,
    formatPhoneNumber,
    getIfoodOrderNumber,
    getClientWhatsappMessage,
  }: DeliveryCardProps) {
    const isIfoodOrder = report.observation?.includes("Pedido iFood #") ?? false;
    const ifoodOrderNumber = getIfoodOrderNumber(report.observation);
    const motoboySelectId = `motoboy-${report.id}`;

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
            <p>Forma de pagamento: {report.payment}</p>
            <p>Valor: R$ {report.value}</p>
            <p>Pix: {report.establishmentPix}</p>
            <p>Refrigerante: {report.soda}</p>
          </ContainerOrder>
        )}

        <ContainerInfo>
          <div>
            {isIfoodOrder && ifoodOrderNumber && (
              <p>Pedido iFood: {ifoodOrderNumber}</p>
            )}

            <p>Cliente: {report.clientName}</p>
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

        {permission !== "shopkeeper" && (
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

        <OrderActions>
          {(permission === "admin" || permission === "superadmin") &&
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

          {permission !== "shopkeeper" && (
            <OrderButton typebutton={true} onClick={() => onNextStep(report)}>
              {getButtonText(report.status, report.id)}
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
    prev.reportSelectedToModal === next.reportSelectedToModal &&
    prev.motoboys === next.motoboys &&
    prev.isUpdating === next.isUpdating
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
  const [updatingDeliveryIds, setUpdatingDeliveryIds] = useState<Set<string>>(
    () => new Set(),
  );

  const [selectedMotoboyByReport, setSelectedMotoboyByReport] = useState<
    Record<string, string>
  >({});

  const [currentCityId, setCurrentCityId] = useState<string>("");
  const reloadTimeoutRef = useRef<number | null>(null);
  const refreshRequestIdRef = useRef(0);
  const didFirstLoadRef = useRef(false);

  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [observation, setObservation] = useState<string>("");
  const [reportSelectedToModal, setReportSelectedToModal] =
    useState<string>("");

  useEffect(() => {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  }, [token]);

  function handleModal() {
    setIsVisible((state) => !state);
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
      [StatusDelivery.COLLECTED]: 1,
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

  function isInAssigned(statusValue?: string) {
    return (
      statusValue === StatusDelivery.ONCOURSE ||
      statusValue === StatusDelivery.COLLECTED
    );
  }

  function getCountDelta(
    previousStatus?: string,
    nextStatus?: string,
  ): DeliveryCountsDelta {
    return {
      pending:
        (previousStatus === StatusDelivery.PENDING ? -1 : 0) +
        (nextStatus === StatusDelivery.PENDING ? 1 : 0),
      assigned:
        (isInAssigned(previousStatus) ? -1 : 0) +
        (isInAssigned(nextStatus) ? 1 : 0),
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

        setReports(rawReports);
        setPendingCount(nextPendingCount);
        setAssignedCount(nextAssignedCount);
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
    if (permission === "shopkeeper") return;

    try {
      const motoboysRes = await api.get("/user/motoboys");
      setMotoboys(motoboysRes.data ?? []);
    } catch (error) {
      console.error("Erro ao carregar motoboys:", error);
    }
  }, [permission]);

  const getMyself = useCallback(async () => {
    try {
      const response = await api.get("/user/myself");
      setCurrentCityId(response.data?.cityId ?? "");
    } catch (error) {
      console.error("Erro ao carregar usuário atual:", error);
    }
  }, []);

  async function handlerNextStep(report: Report) {
    if (isDeliveryUpdating(report.id)) {
      return;
    }

    const selectedMotoboy = getSelectedMotoboy(report);

    let data: DeliveryUpdateData | null = null;
    let newStatus = "";

    if (
      report.status === StatusDelivery.COLLECTED &&
      report.id !== reportSelectedToModal
    ) {
      setReportSelectedToModal(report.id);
      handleModal();
      return;
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
      newStatus = StatusDelivery.COLLECTED;
      data = {
        status: newStatus,
      };
    } else if (report.status === StatusDelivery.COLLECTED) {
      newStatus = StatusDelivery.FINISHED;

      const isIfoodOrder = report.observation?.includes("Pedido iFood #");
      let deliveryCode = "";

      if (isIfoodOrder) {
        const codeTyped = window.prompt(
          "Digite o código de entrega do iFood informado pelo cliente:",
        );

        if (codeTyped === null) {
          return;
        }

        deliveryCode = codeTyped.trim();

        if (!deliveryCode) {
          alert("Informe o código de entrega do iFood.");
          return;
        }
      }

      data = {
        status: newStatus,
        observation: observation === "Sem observação." ? "" : observation,
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
        report.status,
        updatedReport.status || newStatus,
      );
      setPendingCount((state) => Math.max(0, state + delta.pending));
      setAssignedCount((state) => Math.max(0, state + delta.assigned));
      updateReportInListLocally(updatedReport);
      alert(`Solicitação avançada para o passo ${newStatus}`);
      setObservation("");
      setReportSelectedToModal("");
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

    const selectedMotoboy = getSelectedMotoboy(report);

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
        updateReportInListLocally(updatedReport);
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

      const delta = getCountDelta(report.status, StatusDelivery.CANCELED);
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

      const delta = getCountDelta(report.status, undefined);
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

  function getButtonText(currentStatus: string, id: string) {
    if (StatusDelivery.PENDING === currentStatus) {
      return "Atribuir";
    }

    if (StatusDelivery.ONCOURSE === currentStatus) {
      return "Coletar";
    }

    if (StatusDelivery.COLLECTED === currentStatus) {
      if (id !== reportSelectedToModal) {
        return "Observação";
      }

      return "Finalizar";
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

    const match = observation.match(/Pedido iFood\s*#\s*(\d+)/i);

    if (!match) {
      return null;
    }

    return match[1];
  }

  function getHours(date: string) {
    return date.split("T")[1].substring(0, 5);
  }

  function getSelectedMotoboy(report: Report) {
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

  const getClientWhatsappMessage = useCallback((report: Report) => {
    if (!report.establishmentCityId) {
      return undefined;
    }

    return clientWhatsappMessageByCityId.get(String(report.establishmentCityId));
  }, [clientWhatsappMessageByCityId]);

  useEffect(() => {
    const shouldShowLoader = !didFirstLoadRef.current;

    void refreshDashboard(shouldShowLoader).finally(() => {
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
    if (permission === UserType.SHOPKEEPER) {
      return;
    }

    const motoboysPollingInterval = window.setInterval(() => {
      void getMotoboys();
    }, 30000);

    return () => {
      window.clearInterval(motoboysPollingInterval);
    };
  }, [getMotoboys, permission]);

  useEffect(() => {
    void getMyself();
  }, [getMyself]);

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
        isVisible={isVisible}
        handleClose={handleModal}
        setObservation={setObservation}
      />

      <ContainerButtons>
        <BaseButton
          typeReport={status === StatusDelivery.PENDING}
          onClick={() => setStatus(StatusDelivery.PENDING)}
        >
          Livres
          <Flag>{pendingCount}</Flag>
        </BaseButton>

        <BaseButton
          typeReport={status !== StatusDelivery.PENDING}
          onClick={() =>
            setStatus(`${StatusDelivery.ONCOURSE},${StatusDelivery.COLLECTED}`)
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
                reportSelectedToModal={reportSelectedToModal}
                motoboys={motoboys}
                isUpdating={isDeliveryUpdating(report.id)}
                onSelectMotoboy={handleSelectMotoboy}
                onSave={handlerSave}
                onCancel={handlerCancel}
                onNextStep={handlerNextStep}
                onDelete={handlerDelete}
                getButtonText={getButtonText}
                getHours={getHours}
                formatPhoneNumber={formatPhoneNumber}
                getIfoodOrderNumber={getIfoodOrderNumber}
                getClientWhatsappMessage={getClientWhatsappMessage}
              />
            ))}
          </>
        )}
      </ContainerDeliveries>
    </Container>
  );
}