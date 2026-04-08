/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { WhatsappLogo, MapPin } from "phosphor-react";

import { DeliveryContext } from "../../context/DeliveryContext";
import api, { SOCKET_URL } from "../../services/api";
import { City, Motoboy, Report } from "../../shared/interfaces";

import {
  BaseButton,
  Container,
  ContainerButtons,
  ContainerInfo,
  ContainerDeliveries,
  ContainerOrder,
  ContainerShopkeeper,
  Delivery,
  Link,
  ShopkeeperInfo,
  ShopkeeperProfileImage,
  OrderActions,
  OrderButton,
  SelectContainer,
  ContainerImagem,
  ContainerLoading,
  ContainerStatus,
  Status,
  Flag,
} from "./styles";
import { Loader } from "../../components/Loader";
import { BaseModal } from "../../components/Modal";
import { StatusDelivery } from "../../shared/constants/enums.constants";
import {
  getLinkToWhatsapp,
  messageTypes,
} from "../../shared/constants/whatsapp.constants";

type DeliveryUpdateData = {
  status?: string;
  motoboyId?: string;
  observation?: string;
  deliveryCode?: string;
};

export function Dashboard() {
  const { token, permission } = useContext(DeliveryContext);

  const [status, setStatus] = useState<string>(`${StatusDelivery.PENDING}`);
  const [loading, setLoading] = useState<boolean>(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [motoboys, setMotoboys] = useState<Motoboy[]>([]);
  const [reportsCount, setReportsCount] = useState<number>(0);

  const [selectedMotoboy, setSelectedMotoboy] = useState<string>("");

  const [currentCityId, setCurrentCityId] = useState<string>("");
  const reloadTimeoutRef = useRef<number | null>(null);

  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [observation, setObservation] = useState<string>("");
  const [reportSelectedToModal, setReportSelectedToModal] = useState<string>("");

  useEffect(() => {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  }, [token]);

  function handleModal() {
    setIsVisible((state) => !state);
  }

  const getData = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setLoading(true);
      }

      try {
        const response = await api.get(`/delivery?status=${status}`);
        setReports(response.data.data ?? []);
        setReportsCount(response.data.count ?? 0);
      } catch (error: any) {
        alert(error.response?.data?.message || "Erro ao carregar pedidos.");
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [status]
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
          "Digite o código de entrega do iFood informado pelo cliente:"
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
      const response = await api.put(`/delivery/${report.id}`, data);
      const updatedReport = response.data;

      if (
        newStatus === StatusDelivery.ONCOURSE &&
        data.motoboyId &&
        updatedReport?.motoboyId &&
        updatedReport.motoboyId !== data.motoboyId
      ) {
        await getData(false);
        alert("Essa entrega já foi atribuída a outro entregador.");
        return;
      }

      await getData(false);
      alert(`Solicitação avançada para o passo ${newStatus}`);
      setObservation("");
      setReportSelectedToModal("");
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao atualizar pedido.");
    }
  }

  async function handlerSave(report: Report) {
    if (!selectedMotoboy) {
      alert("Selecione o motoboy");
      return;
    }

    try {
      await api.put(`/delivery/${report.id}`, {
        motoboyId: selectedMotoboy,
      });
      await getData(false);
      alert("Motoboy foi atualizado com sucesso.");
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao salvar motoboy.");
    }
  }

  async function handlerCancel(report: Report) {
    const confirmMessage = window.confirm(
      "Você realmente deseja apagar essa entrega?"
    );

    if (!confirmMessage) {
      return;
    }

    try {
      await api.put(`/delivery/${report.id}`, {
        status: "CANCELADO",
      });
      await getData(false);
      alert("O pedido foi cancelado com sucesso.");
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao cancelar pedido.");
    }
  }

  async function handlerDelete(report: Report) {
    try {
      await api.delete(`/delivery/${report.id}`);
      await getData(false);
      alert("Solicitação apagada com sucesso.");
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao apagar pedido.");
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

  function getClientWhatsappMessage(report: Report) {
    if (!report.establishmentCityId) {
      return undefined;
    }

    const city = cities.find(
      (item) => String(item.id) === String(report.establishmentCityId)
    );

    const customMessage = city?.clientWhatsappMessage?.trim();

    return customMessage ? customMessage : undefined;
  }

  useEffect(() => {
    if (motoboys.length === 1) {
      setSelectedMotoboy(motoboys[0].id);
    }
  }, [motoboys]);

  useEffect(() => {
    void getData(true);
  }, [getData]);

  useEffect(() => {
    void getCities();
  }, [getCities]);

  useEffect(() => {
    void getMotoboys();
  }, [getMotoboys]);

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
        void getData(false);
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
  }, [currentCityId, getData]);

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
          {!loading && status === StatusDelivery.PENDING && (
            <Flag>{reportsCount}</Flag>
          )}
        </BaseButton>

        <BaseButton
          typeReport={status !== StatusDelivery.PENDING}
          onClick={() =>
            setStatus(`${StatusDelivery.ONCOURSE},${StatusDelivery.COLLECTED}`)
          }
        >
          Atribuídos
          {!loading && status !== StatusDelivery.PENDING && (
            <Flag>{reportsCount}</Flag>
          )}
        </BaseButton>
      </ContainerButtons>

      <ContainerDeliveries>
        {loading ? (
          <ContainerLoading>
            <Loader size={40} biggestColor="green" smallestColor="gray" />
          </ContainerLoading>
        ) : (
          <>
            {reports.map((report: Report) => {
              const isIfoodOrder =
                report.observation?.includes("Pedido iFood #") ?? false;

              return (
                <Delivery
                  key={report.id}
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
                          messageTypes.motoboy
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

                  {status !== StatusDelivery.PENDING && (
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
                      {isIfoodOrder && getIfoodOrderNumber(report.observation) && (
                        <p>
                          Pedido iFood: {getIfoodOrderNumber(report.observation)}
                        </p>
                      )}

                      <p>Cliente: {report.clientName}</p>
                    </div>

                    {status !== StatusDelivery.PENDING && (
                      <Link
                        href={getLinkToWhatsapp(
                          report.clientPhone,
                          messageTypes.client,
                          getClientWhatsappMessage(report)
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {formatPhoneNumber(report.clientPhone)}{" "}
                        <WhatsappLogo size={18} />
                      </Link>
                    )}
                  </ContainerInfo>

                  {status !== StatusDelivery.PENDING && (
                    <ContainerInfo>
                      <p>Motoboy: {report.motoboyName}</p>
                      <Link
                        href={getLinkToWhatsapp(
                          report.motoboyPhone,
                          messageTypes.establishment
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {formatPhoneNumber(report.motoboyPhone)}{" "}
                        <WhatsappLogo size={18} />
                      </Link>
                    </ContainerInfo>
                  )}

                  <ContainerInfo>
                    {report.createdAt && <p>Criado: {getHours(report.createdAt)}</p>}
                    {report.onCoursedAt && (
                      <p>Atribuído: {getHours(report.onCoursedAt)}</p>
                    )}
                    {report.collectedAt && (
                      <p>Coletado: {getHours(report.collectedAt)}</p>
                    )}
                    {report.finishedAt && (
                      <p>Finalizado: {getHours(report.finishedAt)}</p>
                    )}
                  </ContainerInfo>

                  {permission !== "shopkeeper" && (
                    <SelectContainer>
                      <label htmlFor="motoboy">Motoboy:</label>
                      <select
                        value={selectedMotoboy}
                        onChange={(e) => setSelectedMotoboy(e.target.value)}
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
                          <OrderButton
                            typebutton={true}
                            onClick={() => handlerSave(report)}
                          >
                            Salvar
                          </OrderButton>
                          <OrderButton
                            typebutton={false}
                            onClick={() => handlerCancel(report)}
                          >
                            Cancelar
                          </OrderButton>
                        </>
                      )}

                    {permission !== "shopkeeper" && (
                      <OrderButton
                        typebutton={true}
                        onClick={() => handlerNextStep(report)}
                      >
                        {getButtonText(report.status, report.id)}
                      </OrderButton>
                    )}

                    {permission !== "motoboy" &&
                      report.status === StatusDelivery.PENDING && (
                        <OrderButton
                          typebutton={false}
                          onClick={() => handlerDelete(report)}
                        >
                          Apagar
                        </OrderButton>
                      )}
                  </OrderActions>
                </Delivery>
              );
            })}
          </>
        )}
      </ContainerDeliveries>
    </Container>
  );
}