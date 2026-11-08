import { restaurantApi } from "@/core/api/restaurantApi";
import { LoginResponseDto } from "@/core/auth/dto/login.response.dto";
import { CreateRestaurantDto } from "@/core/restaurant/dto/create-restaurant.dto";
import { UpdateRestaurantDto } from "@/core/restaurant/dto/update-restaurant.dto";
import { Restaurant } from "@/core/common/models/restaurant.model";
import {
  CreateBranchDto,
  NextBranchNameDto,
} from "@/core/restaurant/dto/create-branch.dto";
import {
  QrTokenResponseDto,
  ValidateQrTokenResponseDto,
  AcceptQrInviteDto,
} from "@/core/restaurant/dto/qr-token.dto";
import {
  ClearSampleMenuResponse,
  OnboardingStatus,
  UpdateOnboardingDto,
} from "@/core/restaurant/models/onboarding.model";

export class RestaurantService {
  static async create(data: CreateRestaurantDto) {
    const resp = await restaurantApi.post<LoginResponseDto>("restaurant", data);
    return resp.data;
  }

  static async update(restaurantId: string, data: UpdateRestaurantDto) {
    const resp = await restaurantApi.patch<Restaurant>(
      `restaurant/${restaurantId}`,
      data,
    );
    return resp.data;
  }

  static async getOnboarding() {
    const resp = await restaurantApi.get<OnboardingStatus>(
      "restaurant/onboarding",
    );
    return resp.data;
  }

  static async updateOnboarding(data: UpdateOnboardingDto) {
    const resp = await restaurantApi.patch<OnboardingStatus>(
      "restaurant/onboarding",
      data,
    );
    return resp.data;
  }

  /** Removes the sample menu seeded with the restaurant (before any order). */
  static async clearSampleMenu() {
    const resp = await restaurantApi.post<ClearSampleMenuResponse>(
      "restaurant/onboarding/clear-sample-menu",
    );
    return resp.data;
  }

  static async getNextBranchName(restaurantId: string) {
    const resp = await restaurantApi.get<NextBranchNameDto>(
      `restaurant/${restaurantId}/branches/next-name`,
    );
    return resp.data;
  }

  static async createBranch(restaurantId: string, data: CreateBranchDto) {
    const resp = await restaurantApi.post<LoginResponseDto>(
      `restaurant/${restaurantId}/branches`,
      data,
    );
    return resp.data;
  }

  static async generateQrToken() {
    const resp = await restaurantApi.post<QrTokenResponseDto>(
      "restaurant/qr-token",
    );
    return resp.data;
  }

  static async validateQrToken(token: string) {
    const resp = await restaurantApi.post<ValidateQrTokenResponseDto>(
      "restaurant/validate-qr-token",
      { token },
    );
    return resp.data;
  }

  static async acceptQrInvite(data: AcceptQrInviteDto) {
    const resp = await restaurantApi.post<void>(
      "restaurant/accept-qr-invite",
      data,
    );
    return resp.data;
  }

  static async switchRestaurant(restaurantId: string) {
    const resp = await restaurantApi.post<LoginResponseDto>(
      `/auth/switch-restaurant/${restaurantId}`,
    );

    // Process the response to set the correct role based on current restaurant
    const { token, user, currentRestaurant } = resp.data;
    const currentRole = user.restaurantRoles.find(
      (resRole) => resRole.restaurant.id === currentRestaurant?.id,
    )!.role;

    return {
      token,
      user: { ...user, role: currentRole },
      currentRestaurant,
    };
  }
}
